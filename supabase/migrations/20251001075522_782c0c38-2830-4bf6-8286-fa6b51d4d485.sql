-- Seed sample trainsets
INSERT INTO public.trainsets (id, name, status, total_mileage, operational_hours, battery_level, current_location, last_maintenance_date, next_maintenance_date, fitness_certificate_expiry, current_stabling_position, metadata) VALUES
('TS-001', 'Aurora Express', 'operational', 125000, 8500, 85, 'Platform A', '2025-08-15', '2025-11-15', '2025-12-31', 'STAB-A1', '{"manufacturer": "Siemens", "model": "Velaro", "year": 2020}'::jsonb),
('TS-002', 'Phoenix Rider', 'maintenance', 98000, 6200, 45, 'Depot Bay 3', '2025-09-01', '2025-10-01', '2026-03-15', 'STAB-B2', '{"manufacturer": "Alstom", "model": "Coradia", "year": 2019}'::jsonb),
('TS-003', 'Midnight Runner', 'operational', 156000, 10200, 92, 'Platform C', '2025-07-20', '2025-12-20', '2025-11-30', 'STAB-A3', '{"manufacturer": "Stadler", "model": "FLIRT", "year": 2021}'::jsonb),
('TS-004', 'Dawn Breaker', 'out_of_service', 187000, 12800, 0, 'Maintenance Hall', '2025-05-10', '2025-10-10', '2025-10-15', 'MAINT-1', '{"manufacturer": "Bombardier", "model": "Talent", "year": 2018}'::jsonb),
('TS-005', 'Silver Bullet', 'operational', 72000, 4800, 78, 'Platform B', '2025-08-25', '2026-01-25', '2026-06-30', 'STAB-C1', '{"manufacturer": "CAF", "model": "Civity", "year": 2022}'::jsonb),
('TS-006', 'Thunder Strike', 'cleaning', 145000, 9600, 88, 'Cleaning Station', '2025-08-05', '2025-11-05', '2026-02-28', 'CLEAN-1', '{"manufacturer": "Siemens", "model": "Desiro", "year": 2020}'::jsonb);

-- Seed fitness certificates
INSERT INTO public.fitness_certificates (id, trainset_id, certificate_type, certificate_number, issue_date, expiry_date, status, issuing_authority, inspection_details) VALUES
('CERT-001', 'TS-001', 'Annual Safety', 'ASC-2025-001', '2025-01-01', '2025-12-31', 'valid', 'National Rail Authority', '{"inspector": "John Smith", "passed_checks": 45, "failed_checks": 0}'::jsonb),
('CERT-002', 'TS-002', 'Annual Safety', 'ASC-2025-002', '2025-03-15', '2026-03-15', 'valid', 'National Rail Authority', '{"inspector": "Sarah Johnson", "passed_checks": 43, "failed_checks": 2}'::jsonb),
('CERT-003', 'TS-003', 'Annual Safety', 'ASC-2024-003', '2024-12-01', '2025-11-30', 'expiring_soon', 'National Rail Authority', '{"inspector": "Mike Chen", "passed_checks": 44, "failed_checks": 1}'::jsonb),
('CERT-004', 'TS-004', 'Annual Safety', 'ASC-2024-004', '2024-10-15', '2025-10-15', 'expiring_soon', 'National Rail Authority', '{"inspector": "Emma Davis", "passed_checks": 42, "failed_checks": 3}'::jsonb),
('CERT-005', 'TS-005', 'Annual Safety', 'ASC-2025-005', '2025-06-30', '2026-06-30', 'valid', 'National Rail Authority', '{"inspector": "David Wilson", "passed_checks": 45, "failed_checks": 0}'::jsonb),
('CERT-006', 'TS-006', 'Emergency Equipment', 'EEC-2025-006', '2025-03-01', '2026-02-28', 'valid', 'Safety Compliance Board', '{"inspector": "Lisa Brown", "passed_checks": 15, "failed_checks": 0}'::jsonb);

-- Seed branding contracts
INSERT INTO public.branding_contracts (id, client_name, contract_start, contract_end, status, priority_level, revenue, assigned_trainsets, requirements) VALUES
('BC-001', 'TechCorp Industries', '2025-01-01', '2025-12-31', 'active', 5, 250000, ARRAY['TS-001', 'TS-003'], '{"wrap_type": "full", "colors": ["blue", "white"], "logo_placement": "both_sides"}'::jsonb),
('BC-002', 'GreenEnergy Solutions', '2025-06-01', '2026-05-31', 'active', 4, 180000, ARRAY['TS-005'], '{"wrap_type": "partial", "colors": ["green", "yellow"], "logo_placement": "front_rear"}'::jsonb),
('BC-003', 'Metro Bank', '2025-03-01', '2025-08-31', 'active', 3, 120000, ARRAY['TS-006'], '{"wrap_type": "full", "colors": ["red", "gold"], "logo_placement": "all_sides"}'::jsonb);

-- Seed stabling positions
INSERT INTO public.stabling_positions (id, position_name, depot_section, position_type, track_number, capacity, status, current_occupant, adjacent_positions, facilities, geometry) VALUES
('STAB-A1', 'Platform A1', 'Section A', 'platform', 1, 1, 'occupied', 'TS-001', ARRAY['STAB-A2', 'STAB-A3'], ARRAY['power', 'water', 'compressed_air'], '{"x": 10, "y": 20, "length": 200}'::jsonb),
('STAB-A2', 'Platform A2', 'Section A', 'platform', 2, 1, 'available', NULL, ARRAY['STAB-A1', 'STAB-A3'], ARRAY['power', 'water'], '{"x": 10, "y": 40, "length": 200}'::jsonb),
('STAB-A3', 'Platform A3', 'Section A', 'platform', 3, 1, 'occupied', 'TS-003', ARRAY['STAB-A1', 'STAB-A2'], ARRAY['power'], '{"x": 10, "y": 60, "length": 200}'::jsonb),
('STAB-B2', 'Bay B2', 'Section B', 'maintenance_bay', 5, 1, 'occupied', 'TS-002', ARRAY['STAB-B1', 'STAB-B3'], ARRAY['power', 'water', 'compressed_air', 'lifting_equipment'], '{"x": 50, "y": 40, "length": 250}'::jsonb),
('STAB-C1', 'Platform C1', 'Section C', 'platform', 7, 1, 'occupied', 'TS-005', ARRAY['STAB-C2'], ARRAY['power', 'water'], '{"x": 90, "y": 20, "length": 200}'::jsonb),
('MAINT-1', 'Maintenance Hall 1', 'Maintenance', 'maintenance_bay', 10, 2, 'occupied', 'TS-004', ARRAY['MAINT-2'], ARRAY['power', 'water', 'compressed_air', 'lifting_equipment', 'welding'], '{"x": 120, "y": 50, "length": 300}'::jsonb),
('CLEAN-1', 'Cleaning Station 1', 'Cleaning', 'cleaning', 12, 1, 'occupied', 'TS-006', ARRAY['CLEAN-2'], ARRAY['power', 'water', 'cleaning_equipment'], '{"x": 150, "y": 30, "length": 180}'::jsonb);

-- Seed maintenance jobs
INSERT INTO public.maintenance_jobs (id, trainset_id, job_type, description, priority, status, scheduled_start, scheduled_end, estimated_duration, assigned_staff, requirements, maximo_job_id) VALUES
('JOB-001', 'TS-002', 'Preventive', 'Quarterly brake system inspection', 'high', 'in_progress', '2025-10-01 08:00:00+00', '2025-10-01 16:00:00+00', 480, ARRAY['STAFF-001', 'STAFF-002'], '{"tools": ["brake_tester", "torque_wrench"], "parts": ["brake_pads"], "certifications": ["brake_specialist"]}'::jsonb, 'MX-2025-001'),
('JOB-002', 'TS-004', 'Corrective', 'Battery replacement and electrical system overhaul', 'critical', 'pending', '2025-10-05 06:00:00+00', '2025-10-07 18:00:00+00', 2880, ARRAY['STAFF-003', 'STAFF-004'], '{"tools": ["multimeter", "battery_lift"], "parts": ["battery_pack", "wiring_harness"], "certifications": ["electrical_specialist"]}'::jsonb, 'MX-2025-002'),
('JOB-003', 'TS-001', 'Preventive', 'Monthly safety inspection', 'medium', 'scheduled', '2025-10-15 09:00:00+00', '2025-10-15 12:00:00+00', 180, ARRAY['STAFF-005'], '{"tools": ["inspection_kit"], "parts": [], "certifications": ["safety_inspector"]}'::jsonb, 'MX-2025-003'),
('JOB-004', 'TS-003', 'Cleaning', 'Deep interior cleaning and sanitization', 'low', 'scheduled', '2025-10-10 14:00:00+00', '2025-10-10 18:00:00+00', 240, ARRAY['STAFF-006', 'STAFF-007'], '{"tools": ["cleaning_supplies", "vacuum"], "parts": [], "certifications": []}'::jsonb, 'MX-2025-004'),
('JOB-005', 'TS-005', 'Preventive', 'HVAC system maintenance', 'medium', 'scheduled', '2025-10-20 08:00:00+00', '2025-10-20 14:00:00+00', 360, ARRAY['STAFF-008'], '{"tools": ["hvac_tools"], "parts": ["air_filters"], "certifications": ["hvac_technician"]}'::jsonb, 'MX-2025-005');

-- Seed staff schedules with correct shift enum values (morning, afternoon, night)
INSERT INTO public.staff_schedules (id, staff_id, staff_name, role, date, shift, start_time, end_time, status, assigned_job_id) VALUES
('SCH-001', 'STAFF-001', 'Robert Martinez', 'driver', '2025-10-01', 'morning', '08:00:00', '16:00:00', 'scheduled', 'JOB-001'),
('SCH-002', 'STAFF-002', 'Jennifer Lee', 'driver', '2025-10-01', 'morning', '08:00:00', '16:00:00', 'scheduled', 'JOB-001'),
('SCH-003', 'STAFF-003', 'Michael Anderson', 'driver', '2025-10-05', 'morning', '06:00:00', '14:00:00', 'scheduled', 'JOB-002'),
('SCH-004', 'STAFF-004', 'Patricia Taylor', 'conductor', '2025-10-05', 'morning', '06:00:00', '14:00:00', 'scheduled', 'JOB-002'),
('SCH-005', 'STAFF-005', 'James Wilson', 'driver', '2025-10-15', 'morning', '09:00:00', '12:00:00', 'scheduled', 'JOB-003'),
('SCH-006', 'STAFF-006', 'Maria Garcia', 'conductor', '2025-10-10', 'afternoon', '14:00:00', '18:00:00', 'scheduled', 'JOB-004'),
('SCH-007', 'STAFF-007', 'Christopher Brown', 'driver', '2025-10-10', 'afternoon', '14:00:00', '18:00:00', 'scheduled', 'JOB-004'),
('SCH-008', 'STAFF-008', 'Amanda Johnson', 'conductor', '2025-10-20', 'morning', '08:00:00', '14:00:00', 'scheduled', 'JOB-005');

-- Seed mileage records
INSERT INTO public.mileage_records (trainset_id, date, daily_mileage, route_details) VALUES
('TS-001', '2025-09-01', 420, '{"routes": ["R1", "R2"], "shifts": 2}'::jsonb),
('TS-001', '2025-09-02', 385, '{"routes": ["R1", "R3"], "shifts": 2}'::jsonb),
('TS-001', '2025-09-03', 410, '{"routes": ["R2", "R3"], "shifts": 2}'::jsonb),
('TS-003', '2025-09-01', 445, '{"routes": ["R1", "R4"], "shifts": 2}'::jsonb),
('TS-003', '2025-09-02', 430, '{"routes": ["R2", "R4"], "shifts": 2}'::jsonb),
('TS-003', '2025-09-03', 455, '{"routes": ["R3", "R4"], "shifts": 2}'::jsonb),
('TS-005', '2025-09-01', 390, '{"routes": ["R1", "R2"], "shifts": 2}'::jsonb),
('TS-005', '2025-09-02', 405, '{"routes": ["R2", "R3"], "shifts": 2}'::jsonb),
('TS-005', '2025-09-03', 395, '{"routes": ["R1", "R3"], "shifts": 2}'::jsonb);