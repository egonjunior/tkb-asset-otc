-- Create enum for document types
CREATE TYPE public.document_type AS ENUM ('contrato-quadro', 'dossie-kyc', 'politica-pld');

-- Create enum for document status
CREATE TYPE public.document_status AS ENUM ('pending', 'under_review', 'approved', 'rejected');

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type public.document_type NOT NULL,
  status public.document_status NOT NULL DEFAULT 'pending',
  
  -- File URLs
  client_file_url TEXT,
  tkb_file_url TEXT,
  
  -- Approval/Rejection data
  rejection_reason TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.profiles(id),
  
  -- PLD specific (only for acknowledgment, no signature needed)
  pld_acknowledged BOOLEAN DEFAULT false,
  pld_acknowledged_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  uploaded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one document per type per user
  UNIQUE(user_id, document_type)
);

-- Create document audit log table
CREATE TABLE public.document_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by UUID NOT NULL REFERENCES public.profiles(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add terms_accepted_at to profiles table
ALTER TABLE public.profiles 
ADD COLUMN terms_accepted_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_documents_type ON public.documents(document_type);
CREATE INDEX idx_audit_log_document_id ON public.document_audit_log(document_id);
CREATE INDEX idx_audit_log_timestamp ON public.document_audit_log(timestamp DESC);

-- Enable Row Level Security
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents table

-- Users can view their own documents
CREATE POLICY "Users can view own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own documents
CREATE POLICY "Users can insert own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own documents (but only specific fields)
CREATE POLICY "Users can update own documents"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all documents
CREATE POLICY "Admins can view all documents"
  ON public.documents FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all documents
CREATE POLICY "Admins can update all documents"
  ON public.documents FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for document_audit_log table

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON public.document_audit_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = document_audit_log.document_id 
    AND documents.user_id = auth.uid()
  ));

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON public.document_audit_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON public.document_audit_log FOR INSERT
  WITH CHECK (true);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
);

-- RLS Policies for storage.objects

-- Users can upload their own documents
CREATE POLICY "Users can upload own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = 'client' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Users can view their own documents
CREATE POLICY "Users can view own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND
    (
      ((storage.foldername(name))[1] = 'client' AND (storage.foldername(name))[2] = auth.uid()::text) OR
      ((storage.foldername(name))[1] = 'tkb' AND EXISTS (
        SELECT 1 FROM public.documents 
        WHERE documents.user_id = auth.uid() 
        AND documents.tkb_file_url LIKE '%' || name || '%'
      ))
    )
  );

-- Admins can view all documents
CREATE POLICY "Admins can view all documents in storage"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Admins can upload TKB documents
CREATE POLICY "Admins can upload TKB documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = 'tkb' AND
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION public.update_documents_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER documents_updated_at_trigger
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_documents_updated_at();

-- Trigger to log document changes automatically
CREATE OR REPLACE FUNCTION public.log_document_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.document_audit_log (document_id, action, performed_by, metadata)
    VALUES (
      NEW.id,
      'created',
      auth.uid(),
      jsonb_build_object('document_type', NEW.document_type)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.status != NEW.status THEN
      INSERT INTO public.document_audit_log (document_id, action, performed_by, metadata)
      VALUES (
        NEW.id,
        'status_changed',
        auth.uid(),
        jsonb_build_object(
          'old_status', OLD.status,
          'new_status', NEW.status,
          'rejection_reason', NEW.rejection_reason
        )
      );
    END IF;
    
    -- Log PLD acknowledgment
    IF OLD.pld_acknowledged = false AND NEW.pld_acknowledged = true THEN
      INSERT INTO public.document_audit_log (document_id, action, performed_by, metadata)
      VALUES (
        NEW.id,
        'pld_acknowledged',
        auth.uid(),
        jsonb_build_object('acknowledged_at', NEW.pld_acknowledged_at)
      );
    END IF;
    
    -- Log file uploads
    IF OLD.client_file_url IS DISTINCT FROM NEW.client_file_url THEN
      INSERT INTO public.document_audit_log (document_id, action, performed_by, metadata)
      VALUES (
        NEW.id,
        'client_file_uploaded',
        auth.uid(),
        jsonb_build_object('file_url', NEW.client_file_url)
      );
    END IF;
    
    IF OLD.tkb_file_url IS DISTINCT FROM NEW.tkb_file_url THEN
      INSERT INTO public.document_audit_log (document_id, action, performed_by, metadata)
      VALUES (
        NEW.id,
        'tkb_file_uploaded',
        auth.uid(),
        jsonb_build_object('file_url', NEW.tkb_file_url)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER document_audit_trigger
  AFTER INSERT OR UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.log_document_changes();

-- Enable Realtime for documents table
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_audit_log;