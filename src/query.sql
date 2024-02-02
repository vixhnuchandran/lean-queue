
CREATE TABLE IF NOT EXISTS queues (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL ,
  tags VARCHAR(255)[],
  options JSONB ,
  info JSONB NOT NULL,
  notes VARCHAR(255)
);
  
CREATE TYPE task_status AS ENUM ('available', 'processing', 'completed', 'error');

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  task_id VARCHAR(255) NOT NULL,
  params JSONB NOT NULL,
  priority INT DEFAULT 5,
  status task_status DEFAULT 'available',
  result JSONB DEFAULT NULL,
  start_time TIMESTAMP DEFAULT NULL,
  end_time TIMESTAMP DEFAULT NULL,
  expiry_time TIMESTAMP DEFAULT NULL,
  info JSONB DEFAULT '{"added_at": "' || NOW()::TEXT || '"}'::JSONB,
  queue_id INTEGER REFERENCES queues(id) ON DELETE CASCADE ON UPDATE CASCADE
);

