INSERT INTO activity_logs 
(admin_id, action_type, target_table, target_id, description)
VALUES
(1, 'ADD_LOCATION', 'locations', 1, 
 'Added new location: NBSC testloc BA Building'),

(1, 'ADD_LOCATION', 'locations', 2, 
 'Added new location: NBSC testloc SAS Office'),

(2, 'ADD_LOCATION', 'locations', 3, 
 'Added new location: NBSC testloc ICS Dept'),

(1, 'UPDATE_STATUS', 'locations', 1, 
 'Changed pollution level to High'),

(1, 'RESOLVE_FEEDBACK', 'feedback', 3, 
 'Marked feedback as resolved');