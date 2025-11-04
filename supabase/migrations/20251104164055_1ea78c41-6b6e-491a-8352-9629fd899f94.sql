-- Create function to check if a document number is available for registration
CREATE OR REPLACE FUNCTION public.is_document_available(doc text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  normalized_doc text;
BEGIN
  -- Normalize document: remove all non-digits
  normalized_doc := regexp_replace(doc, '\D', '', 'g');
  
  -- Return true if document is NOT found (available)
  RETURN NOT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE regexp_replace(document_number, '\D', '', 'g') = normalized_doc
  );
END;
$function$;