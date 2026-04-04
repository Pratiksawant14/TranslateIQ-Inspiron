CREATE TABLE projects (
	id UUID NOT NULL, 
	name VARCHAR NOT NULL, 
	description TEXT, 
	source_language VARCHAR NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE, 
	updated_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE TABLE documents (
	id UUID NOT NULL, 
	project_id UUID, 
	filename VARCHAR, 
	file_type VARCHAR, 
	status VARCHAR, 
	raw_content TEXT, 
	total_segments INTEGER, 
	created_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id) ON DELETE CASCADE
);

CREATE TABLE translation_memory (
	id UUID NOT NULL, 
	project_id UUID, 
	source_language VARCHAR, 
	target_language VARCHAR, 
	source_text TEXT, 
	target_text TEXT, 
	qdrant_vector_id VARCHAR, 
	created_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id)
);

CREATE TABLE glossary_entries (
	id UUID NOT NULL, 
	project_id UUID, 
	source_language VARCHAR, 
	target_language VARCHAR, 
	source_term VARCHAR NOT NULL, 
	target_term VARCHAR NOT NULL, 
	context_notes TEXT, 
	created_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id)
);

CREATE TABLE style_profiles (
	id UUID NOT NULL, 
	project_id UUID, 
	name VARCHAR, 
	tone VARCHAR, 
	custom_rules TEXT, 
	target_language VARCHAR, 
	created_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(project_id) REFERENCES projects (id)
);

CREATE TABLE segments (
	id UUID NOT NULL, 
	document_id UUID, 
	segment_index INTEGER, 
	content_type VARCHAR, 
	source_text TEXT NOT NULL, 
	translated_text TEXT, 
	tm_match_type VARCHAR, 
	tm_match_score FLOAT, 
	confidence_score FLOAT, 
	status VARCHAR, 
	created_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(document_id) REFERENCES documents (id) ON DELETE CASCADE
);

CREATE TABLE audit_log (
	id UUID NOT NULL, 
	segment_id UUID, 
	action VARCHAR, 
	original_text TEXT, 
	new_text TEXT, 
	created_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(segment_id) REFERENCES segments (id)
);

CREATE TABLE telemetry_signals (
	id UUID NOT NULL, 
	segment_id UUID, 
	source_text TEXT, 
	mt_output TEXT, 
	human_edit TEXT, 
	signal_label VARCHAR, 
	created_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(segment_id) REFERENCES segments (id)
);

