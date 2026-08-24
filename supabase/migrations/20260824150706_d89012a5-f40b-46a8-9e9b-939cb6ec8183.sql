CREATE TABLE public.admin_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid,
  actor_email text,
  actor_role text NOT NULL DEFAULT current_user,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  entity_label text,
  before_state jsonb,
  after_state jsonb,
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX admin_audit_log_occurred_at_idx ON public.admin_audit_log (occurred_at DESC);
CREATE INDEX admin_audit_log_entity_idx ON public.admin_audit_log (entity_type, entity_id);

GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view the audit log"
  ON public.admin_audit_log
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ));

-- Records permission / access-rule changes. SECURITY DEFINER so the append-only
-- table cannot be written directly by clients; not executable by app roles.
CREATE OR REPLACE FUNCTION public.log_admin_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_email text;
  v_action text;
  v_target uuid;
BEGIN
  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = v_actor;

  IF TG_OP = 'INSERT' THEN
    v_action := 'role_granted';
    v_target := NEW.user_id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'role_changed';
    v_target := NEW.user_id;
  ELSE
    v_action := 'role_revoked';
    v_target := OLD.user_id;
  END IF;

  INSERT INTO public.admin_audit_log (
    actor_user_id, actor_email, action, entity_type, entity_id, entity_label,
    before_state, after_state
  ) VALUES (
    v_actor,
    v_email,
    v_action,
    'user_role',
    v_target::text,
    (SELECT u.email FROM auth.users u WHERE u.id = v_target),
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION public.log_admin_audit_event() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER user_roles_audit
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_admin_audit_event();