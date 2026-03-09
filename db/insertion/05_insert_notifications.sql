INSERT INTO notifications
  (user_id, request_id, title, message, type, is_read, created_at)
VALUES

  (
    1, 2,
    'Request Approved',
    'Your data request (REQ-1002) for NBSC Library has been approved by the manager. You may now download the data.',
    'approved',
    0,
    DATE_SUB(NOW(), INTERVAL 1 DAY)
  ),

  (
    1, 3,
    'Request Denied',
    'Your data request (REQ-1003) for SWDC Building has been denied by the manager.',
    'denied',
    0,
    DATE_SUB(NOW(), INTERVAL 2 DAY)
  );
