INSERT INTO buildings
  (code, name, description, latitude, longitude, pollution_level, lux_baseline, is_online)
VALUES
  (
    'B07',
    'Engineering Building',
    'Mechanical and civil engineering classrooms and labs.',
    8.35880000, 124.86850000,
    'moderate',
    65.00,
    1
  );

INSERT INTO activity_log
  (actor_id, action, target_type, target_id, meta)
VALUES
  (
    2,
    'building_added',
    'building',
    7,
    '{"code": "B07", "name": "Engineering Building", "pollution_level": "moderate"}'
  );

SELECT id, code, name, pollution_level, lux_baseline, is_online, created_at
FROM   buildings
WHERE  code = 'B07';
