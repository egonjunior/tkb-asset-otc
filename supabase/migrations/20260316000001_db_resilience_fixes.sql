-- Remover restrições que exigem que o administrador tenha um perfil de cliente
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_reviewed_by_fkey;
ALTER TABLE public.documents 
  ADD CONSTRAINT documents_reviewed_by_fkey 
  FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);

ALTER TABLE public.document_audit_log DROP CONSTRAINT IF EXISTS document_audit_log_performed_by_fkey;
ALTER TABLE public.document_audit_log 
  ADD CONSTRAINT document_audit_log_performed_by_fkey 
  FOREIGN KEY (performed_by) REFERENCES auth.users(id);

-- Tornar o gatilho de log de auditoria mais resiliente
CREATE OR REPLACE FUNCTION public.log_document_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.document_audit_log (document_id, action, performed_by, metadata)
    VALUES (
      NEW.id,
      'created',
      current_user_id,
      jsonb_build_object('document_type', NEW.document_type)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log mudança de status
    IF OLD.status != NEW.status THEN
      INSERT INTO public.document_audit_log (document_id, action, performed_by, metadata)
      VALUES (
        NEW.id,
        'status_changed',
        current_user_id,
        jsonb_build_object(
          'old_status', OLD.status,
          'new_status', NEW.status,
          'rejection_reason', NEW.rejection_reason
        )
      );
    END IF;
    
    -- Log ciência de PLD
    IF OLD.pld_acknowledged = false AND NEW.pld_acknowledged = true THEN
      INSERT INTO public.document_audit_log (document_id, action, performed_by, metadata)
      VALUES (
        NEW.id,
        'pld_acknowledged',
        current_user_id,
        jsonb_build_object('acknowledged_at', NEW.pld_acknowledged_at)
      );
    END IF;
    
    -- Log uploads de arquivos
    IF OLD.client_file_url IS DISTINCT FROM NEW.client_file_url THEN
      INSERT INTO public.document_audit_log (document_id, action, performed_by, metadata)
      VALUES (
        NEW.id,
        'client_file_uploaded',
        current_user_id,
        jsonb_build_object('file_url', NEW.client_file_url)
      );
    END IF;
    
    IF OLD.tkb_file_url IS DISTINCT FROM NEW.tkb_file_url THEN
      INSERT INTO public.document_audit_log (document_id, action, performed_by, metadata)
      VALUES (
        NEW.id,
        'tkb_file_uploaded',
        current_user_id,
        jsonb_build_object('file_url', NEW.tkb_file_url)
      );
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Se falhar o log de auditoria, não bloqueia a operação principal
  RAISE WARNING 'Falha ao gravar log de auditoria: %', SQLERRM;
  RETURN NEW;
END;
$$ ;
