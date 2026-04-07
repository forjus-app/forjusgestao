
CREATE OR REPLACE FUNCTION public.on_deadline_complete()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF (NEW.status = 'completed' AND OLD.status <> 'completed') THEN
    NEW.completed_at = COALESCE(NEW.completed_at, now());
  END IF;

  RETURN NEW;
END;
$function$;
