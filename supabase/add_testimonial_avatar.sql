-- Add avatar column to portfolio_testimonials table
ALTER TABLE portfolio_testimonials 
ADD COLUMN IF NOT EXISTS avatar TEXT;

