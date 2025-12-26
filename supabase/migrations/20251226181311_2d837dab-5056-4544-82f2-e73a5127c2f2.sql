-- Create holidays table for managing Indian calendar holidays
CREATE TABLE public.holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'public', -- public, optional, restricted
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Everyone can view holidays
CREATE POLICY "Everyone can view holidays" 
ON public.holidays 
FOR SELECT 
USING (true);

-- Only admins can manage holidays
CREATE POLICY "Admins can manage holidays" 
ON public.holidays 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_holidays_updated_at
BEFORE UPDATE ON public.holidays
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add status column to attendance if it doesn't have approval workflow
-- Update attendance table to support approval workflow
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS work_hours NUMERIC(4,2);

-- Update leaves table to add leave balance tracking
ALTER TABLE public.leaves
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS days_count INTEGER;

-- Create leave balance table
CREATE TABLE public.leave_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  total_allowed INTEGER NOT NULL DEFAULT 2,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, year, month)
);

ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view their own leave balance" 
ON public.leave_balances 
FOR SELECT 
USING (employee_id = get_employee_id(auth.uid()));

CREATE POLICY "Admins and managers can view all leave balances" 
ON public.leave_balances 
FOR SELECT 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins can manage leave balances" 
ON public.leave_balances 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_leave_balances_updated_at
BEFORE UPDATE ON public.leave_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add lock status to salary table
ALTER TABLE public.salary
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS working_days INTEGER,
ADD COLUMN IF NOT EXISTS present_days INTEGER,
ADD COLUMN IF NOT EXISTS absent_days INTEGER,
ADD COLUMN IF NOT EXISTS leave_days INTEGER,
ADD COLUMN IF NOT EXISTS per_day_salary NUMERIC(10,2);

-- Insert some default Indian holidays for 2025
INSERT INTO public.holidays (name, date, type, description) VALUES
('Republic Day', '2025-01-26', 'public', 'National holiday celebrating the constitution'),
('Holi', '2025-03-14', 'public', 'Festival of colors'),
('Good Friday', '2025-04-18', 'public', 'Christian holiday'),
('Eid ul-Fitr', '2025-03-31', 'public', 'Islamic festival marking end of Ramadan'),
('Buddha Purnima', '2025-05-12', 'public', 'Birth anniversary of Lord Buddha'),
('Independence Day', '2025-08-15', 'public', 'National holiday celebrating independence'),
('Janmashtami', '2025-08-16', 'public', 'Birth anniversary of Lord Krishna'),
('Gandhi Jayanti', '2025-10-02', 'public', 'Birth anniversary of Mahatma Gandhi'),
('Dussehra', '2025-10-02', 'public', 'Festival celebrating victory of good over evil'),
('Diwali', '2025-10-20', 'public', 'Festival of lights'),
('Eid ul-Adha', '2025-06-07', 'public', 'Islamic festival of sacrifice'),
('Christmas', '2025-12-25', 'public', 'Christian holiday celebrating birth of Jesus')
ON CONFLICT (date) DO NOTHING;