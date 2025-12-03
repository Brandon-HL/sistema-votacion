-- Esquema de base de datos MySQL para Sistema de Votación
-- Ejecutar este script en tu base de datos MySQL

CREATE DATABASE IF NOT EXISTS sistema_votacion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sistema_votacion;

-- Tabla de usuarios (reemplaza profiles)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  dni VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  age INT,
  role ENUM('admin', 'supervisor', 'voter') NOT NULL DEFAULT 'voter',
  status ENUM('pending', 'active', 'suspended') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_dni (dni),
  INDEX idx_role (role),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de encuestas
CREATE TABLE IF NOT EXISTS polls (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by VARCHAR(36) NOT NULL,
  end_date DATETIME NOT NULL,
  min_age INT DEFAULT 18,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_created_by (created_by),
  INDEX idx_is_active (is_active),
  INDEX idx_end_date (end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de candidatos
CREATE TABLE IF NOT EXISTS candidates (
  id VARCHAR(36) PRIMARY KEY,
  poll_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  party VARCHAR(255) NOT NULL,
  photo_url TEXT,
  age INT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
  INDEX idx_poll_id (poll_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de votos (con restricción única para evitar doble voto)
CREATE TABLE IF NOT EXISTS votes (
  id VARCHAR(36) PRIMARY KEY,
  poll_id VARCHAR(36) NOT NULL,
  candidate_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_vote (poll_id, user_id),
  FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_poll_id (poll_id),
  INDEX idx_user_id (user_id),
  INDEX idx_candidate_id (candidate_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

