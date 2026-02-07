-- ENUM types
CREATE TYPE subscription_plan AS ENUM ('silver', 'gold', 'platinum');
CREATE TYPE subscription_status AS ENUM ('pending', 'active', 'past_due', 'cancelled', 'expired');
CREATE TYPE payment_provider AS ENUM ('stripe', 'toss');

-- subscriptions table
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL,
  provider payment_provider NOT NULL,
  status subscription_status NOT NULL DEFAULT 'pending',
  external_customer_id TEXT NOT NULL,
  external_subscription_id TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Only 1 active subscription per user
CREATE UNIQUE INDEX uniq_active_subscription
  ON subscriptions (user_id)
  WHERE status IN ('pending', 'active', 'past_due');

-- RLS: SELECT only own subscription
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies → only Service Role Key can write

-- Trigger: sync profiles.plan from subscriptions
CREATE OR REPLACE FUNCTION sync_profile_plan()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE profiles SET plan = NEW.plan::text, updated_at = now()
    WHERE id = NEW.user_id;
  ELSIF NEW.status IN ('cancelled', 'expired') THEN
    UPDATE profiles SET plan = 'free', updated_at = now()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION sync_profile_plan();
