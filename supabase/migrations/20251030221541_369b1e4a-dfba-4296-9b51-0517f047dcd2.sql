-- Add locked_at column to track when price was locked
ALTER TABLE orders 
ADD COLUMN locked_at timestamp with time zone;