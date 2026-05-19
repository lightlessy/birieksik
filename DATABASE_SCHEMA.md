# Database Schema

## profiles

Stores user profile data.

Fields:
- id: uuid, primary key, references auth.users.id
- full_name: text, required
- email: text, required
- department: text, optional
- class_year: text, optional
- contact_handle: text, optional
- created_at: timestamp

## requests

Stores activity requests.

Fields:
- id: uuid, primary key
- creator_id: uuid, references profiles.id
- title: text, required
- activity_type: text, required
- campus: text, required
- location_text: text, optional
- needed_count: integer, required
- current_count: integer, optional
- starts_at: timestamp, optional
- description: text, optional
- status: text, enum: open, filled, cancelled, expired
- created_at: timestamp
-time_text: text
## applications

Stores join applications.

Fields:
- id: uuid, primary key
- request_id: uuid, references requests.id
- applicant_id: uuid, references profiles.id
- message: text, optional
- status: text, enum: pending, accepted, rejected
- created_at: timestamp

## Rules
- Users can read open requests.
- Users can create requests only as themselves.
- Users can apply to requests only as themselves.
- Request owners can see applications to their own requests.
- Request owners can accept or reject applications.