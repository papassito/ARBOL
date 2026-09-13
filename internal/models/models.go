package models

import "time"

// Constantes de validación para Person (Ccheck constraints de la DB)
const (
	GenderMale    = "MALE"
	GenderFemale  = "FEMALE"
	GenderUnknown = "UNKNOWN"

	StateLiving   = "LIVING"
	StateDeceased = "DECEASED"
	StateUnknown  = "UNKNOWN"

	ResearchDocumented    = "DOCUMENTED"
	ResearchFamilySourced = "FAMILY-SOURCED"
	ResearchHypothesis    = "HYPOTHESIS"
	ResearchUnknown       = "UNKNOWN"
)

// Constantes de validación para Relationship
const (
	RelParentChild    = "PARENT_CHILD"
	RelSpousal        = "SPOUSAL"
	RelSiblingLateral = "SIBLING_LATERAL"
	RelOther          = "OTHER"

	VerifyDocumented    = "DOCUMENTED"
	VerifyFamilySourced = "FAMILY-SOURCED"
	VerifyHypothesis    = "HYPOTHESIS"
	VerifyRejected      = "REJECTED"
	VerifyUnknown       = "UNKNOWN"
)

// Constantes de validación para Event
const (
	EventBirth     = "BIRTH"
	EventBaptism   = "BAPTISM"
	EventMarriage  = "MARRIAGE"
	EventDeath     = "DEATH"
	EventBurial    = "BURIAL"
	EventResidence = "RESIDENCE"
	EventMigration = "MIGRATION"
)

// Constantes de validación para Evidence
const (
	EvidenceCivilRecord = "CIVIL_RECORD"
	EvidenceParishBook  = "PARISH_BOOK"
	EvidencePhoto       = "PHOTO"
	EvidenceTestimony   = "TESTIMONY"
	EvidenceOther       = "OTHER"

	ConfidenceHigh   = "HIGH"
	ConfidenceMedium = "MEDIUM"
	ConfidenceLow    = "LOW"
)

// Person representa un registro de identidad genealógica en el sistema
type Person struct {
	ID             string    `json:"id"`
	CanonicalName  string    `json:"canonical_name"`
	Gender         string    `json:"gender"`          // MALE, FEMALE, UNKNOWN
	State          string    `json:"state"`           // LIVING, DECEASED, UNKNOWN
	ResearchStatus string    `json:"research_status"` // DOCUMENTED, FAMILY-SOURCED, HYPOTHESIS, UNKNOWN
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// Relationship representa un vínculo relacional entre dos entidades Person
type Relationship struct {
	ID                string    `json:"id"`
	PersonAID         string    `json:"person_a_id"`
	PersonBID         string    `json:"person_b_id"`
	Type              string    `json:"type"`               // PARENT_CHILD, SPOUSAL, SIBLING_LATERAL, OTHER
	VerificationLevel string    `json:"verification_level"` // DOCUMENTED, FAMILY-SOURCED, HYPOTHESIS, REJECTED, UNKNOWN
	ProvenanceID      *string   `json:"provenance_id,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
}

// Event representa hitos geohistóricos asociados a Person o Relationship
type Event struct {
	ID                   string  `json:"id"`
	PersonID             *string `json:"person_id,omitempty"`
	RelationshipID       *string `json:"relationship_id,omitempty"`
	Type                 string  `json:"type"` // BIRTH, BAPTISM, MARRIAGE, DEATH, BURIAL, RESIDENCE, MIGRATION
	EventYear            int     `json:"event_year"`
	EventMonth           *int    `json:"event_month,omitempty"`
	EventDay             *int    `json:"event_day,omitempty"`
	IsApproximate        bool    `json:"is_approximate"`
	ConfidenceRangeYears *int    `json:"confidence_range_years,omitempty"`
	PlaceID              *string `json:"place_id,omitempty"`
	ProvenanceID         *string `json:"provenance_id,omitempty"`
}

// Evidence mapea las pruebas físicas o lógicas ligadas a una fuente
type Evidence struct {
	ID               string    `json:"id"`
	SourceID         string    `json:"source_id"`
	Type             string    `json:"type"` // CIVIL_RECORD, PARISH_BOOK, PHOTO, TESTIMONY, OTHER
	ConfidenceRating string    `json:"confidence_rating"`
	FileHash         *string   `json:"file_hash,omitempty"`
	FilePath         *string   `json:"file_path,omitempty"`
	Transcription    *string   `json:"transcription,omitempty"`
	ProvenanceID     *string   `json:"provenance_id,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
}

// Citation indica la ubicación bibliográfica de una pieza de evidencia
type Citation struct {
	ID              string  `json:"id"`
	EvidenceID      string  `json:"evidence_id"`
	Volume          *string `json:"volume,omitempty"`
	Book            *string `json:"book,omitempty"`
	PageNumber      *string `json:"page_number,omitempty"`
	EntryNumber     *string `json:"entry_number,omitempty"`
	CustomReference *string `json:"custom_reference,omitempty"`
}
