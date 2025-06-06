-- Critical database indexes for ResilienceHub performance optimization
-- Run these indexes to resolve N+1 query problems and improve response times

-- User-related indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_therapist_id ON users(therapist_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_status ON users(role, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_current_viewing_client_id ON users(current_viewing_client_id);

-- Session indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Emotion records indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emotion_records_user_id ON emotion_records(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emotion_records_timestamp ON emotion_records(timestamp);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emotion_records_user_timestamp ON emotion_records(user_id, timestamp);

-- Thought records indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_thought_records_user_id ON thought_records(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_thought_records_emotion_record_id ON thought_records(emotion_record_id);

-- Journal entries indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(created_at);

-- Goals indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_goals_status ON goals(status);

-- Notifications indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);

-- System logs indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_logs_action_type ON system_logs(action_type);

-- Resource assignments indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resource_assignments_user_id ON resource_assignments(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resource_assignments_resource_id ON resource_assignments(resource_id);

-- Client invitations indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_invitations_therapist_id ON client_invitations(therapist_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_invitations_email ON client_invitations(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_invitations_status ON client_invitations(status);

-- Composite indexes for frequent queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_therapist_active ON users(role, therapist_id) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emotion_records_recent ON emotion_records(user_id, timestamp) WHERE timestamp > NOW() - INTERVAL '30 days';

ANALYZE;