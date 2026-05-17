CREATE TABLE IF NOT EXISTS equipments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  serial_number VARCHAR(100) NOT NULL,
  image TEXT
);
