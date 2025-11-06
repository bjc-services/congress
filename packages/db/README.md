# Database Package (@acme/db)

Technical documentation for the Congress Beneficiary Management System database schema. This package contains all database table definitions, relationships, and type exports using Drizzle ORM with PostgreSQL.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Schema Organization](#schema-organization)
- [Core Entities](#core-entities)
- [Data Flow Patterns](#data-flow-patterns)
- [Relationships & Joins](#relationships--joins)
- [Enums & Type Safety](#enums--type-safety)
- [Indexing Strategy](#indexing-strategy)
- [Temporal Data Patterns](#temporal-data-patterns)
- [Audit Trail Implementation](#audit-trail-implementation)
- [Migration Strategy](#migration-strategy)
- [Query Patterns](#query-patterns)
- [Best Practices](#best-practices)

## Architecture Overview

The database is designed with the following principles:

1. **Normalization**: Eliminate redundancy while maintaining query performance
2. **Temporal Tracking**: Track changes over time with start/end dates
3. **Soft Deletes**: Use `archivedAt` timestamps for important entities
4. **Audit Trails**: Immutable records of calculations and decisions
5. **Referential Integrity**: Proper foreign keys with appropriate cascade rules
6. **Type Safety**: Drizzle ORM provides full TypeScript types from schema

### Technology Stack

- **ORM**: Drizzle ORM
- **Database**: PostgreSQL 14+
- **Migration Tool**: Drizzle Kit
- **Type Generation**: Automatic from schema definitions

## Schema Organization

Schema files are organized by domain:

```txt
src/schema/
├── index.ts                      # Central export point
├── dashboard-auth.sql.ts         # Staff authentication & sessions
├── beneficiary-auth.sql.ts       # Beneficiary authentication & sessions
├── person.sql.ts                 # Person records, contacts, addresses, relationships
├── household.sql.ts              # Household composition & membership
├── upload.sql.ts                 # File upload tracking
├── program.sql.ts                # Programs & versions
├── program-requirements.sql.ts   # Eligibility criteria & document requirements
├── application.sql.ts            # Applications & application documents
├── payment-formula.sql.ts        # Payment calculation formulas & audit
├── payment.sql.ts                # Payment records
├── organization.sql.ts           # Organizations, coordinators, committees
├── message.sql.ts                # Staff-beneficiary communications
└── recommendation.sql.ts         # Committee recommendations
```

## Core Entities

### Authentication Layer

#### Dashboard Users (`user`, `session`, `account`, `verification`)

Staff/admin authentication using better-auth pattern:

- Email-based authentication
- OAuth provider support (via `account` table)
- Session management with device tracking
- Email verification workflow

**Foreign Key Pattern**:

- Use `ulid("user")` type for user references throughout system
- Enables easy identification and debugging in logs

#### Beneficiary Accounts (`beneficiary_account`, `beneficiary_session`, `beneficiary_password_reset`)

Separate authentication system for beneficiaries:

- National ID + phone number based
- Password authentication
- Account approval workflow (`pending` → `approved`)
- Phone-based password reset
- Rate limiting via `failedLoginAttempts` and `lockedUntil`

**Key Constraint**: `nationalId` is unique and links to `person.nationalId` (not FK for flexibility)

### Person & Identity Layer

#### Person (`person`)

Central identity record for all individuals:

```typescript
{
  id: bigserial,                 // Primary key
  nationalId: varchar(10),       // Unique identifier (e.g., SSN)
  firstName, lastName, gender,
  dateOfBirth: date,
  timestamps
}
```

**Design Decision**:

- Person exists independently of beneficiary accounts
- Staff can create person records for non-registered beneficiaries
- One person can have zero or one beneficiary account

#### Contacts (`person_contact`)

Multi-valued contact information:

```typescript
{
  personId: bigint,
  contactType: enum('phone', 'email'),
  value: text,
  isPrimary: boolean
}
```

**Constraints**:

- Unique `(personId, value)` - no duplicate contacts
- Unique `(personId, contactType)` where `isPrimary = true` - only one primary per type

#### Addresses (`person_address`)

Temporal address tracking:

```typescript
{
  personId: bigint,
  addressLine1, addressLine2, city, postalCode, country,
  startDate: timestamp,
  endDate: timestamp?,
}
```

**Constraints**:

- Unique `(personId)` where `endDate IS NULL` - only one current address
- Check: `endDate > startDate` if endDate is set

#### Relationships (`person_relationship`)

Directional relationships between people:

```typescript
{
  personId: bigint,              // Subject
  relatedPersonId: bigint,       // Object
  relationshipType: enum,        // 'spouse', 'child', 'parent', 'guardian', etc.
  startDate, endDate, endReason
}
```

**Direction Rules**:

- Parent → Child (one direction)
- Guardian → Child (one direction)
- Spouse ↔ Spouse (bidirectional, created as two records)
- Siblings are implicit (shared parent)

**Constraints**:

- Unique spouse relationship: `LEAST(personId, relatedPersonId), GREATEST(personId, relatedPersonId), type` where `type = 'spouse' AND endDate IS NULL`
- Check: `personId != relatedPersonId`

### Household Layer

#### Household (`household`)

Represents a group of people living together:

```typescript
{
  id: bigserial,
  primaryAddressId: ulid?,       // Links to person_address
  name: text?                    // Optional: "Cohen Household"
}
```

**Purpose**: Separate from family relationships. Models "who lives together" vs "who is related"

#### Household Members (`household_member`)

Temporal membership tracking:

```typescript
{
  householdId: bigint,
  personId: bigint,
  role: enum('head', 'spouse', 'child', 'dependent', 'parent', 'guardian', 'other'),
  isPrimary: boolean,
  startDate, endDate
}
```

**Constraints**:

- Unique `(householdId, personId)` where `endDate IS NULL` - one active membership
- Unique `(householdId)` where `isPrimary = true AND endDate IS NULL` - one primary member

**Query Pattern**: Current household members

```sql
SELECT * FROM household_member 
WHERE householdId = ? AND endDate IS NULL
```

### Program Layer

#### Program (`program`)

Template for assistance programs:

```typescript
{
  id: bigserial,
  name: text,                           // "Avrechim Grant"
  description: text?,
  enrollmentType: enum('self_enrolled', 'committee_enrolled'),
  requiresHouseholdInfo: boolean,
  isVisibleInPortal: boolean,
  createdByUserId: ulid,
  archivedAt: timestamp?
}
```

**Lifecycle**: Programs are templates that can be reused across multiple years/seasons

#### Program Version (`program_version`)

Time-bound instance of a program:

```typescript
{
  id: bigserial,
  programId: bigint,
  versionName: text,                    // "Pesach 2026"
  description: text?,
  startDate: date,                      // Enrollment opens
  endDate: date,                        // Enrollment closes
  isActive: boolean,
  createdByUserId: ulid
}
```

**Constraint**: Unique `(programId, versionName)`

**Active Management**:

- `isActive` allows disabling without archiving
- `startDate/endDate` define enrollment window
- Applications can be submitted only during window (enforced in application logic)

#### Eligibility Criteria (`eligibility_criteria`)

Field-based rules for eligibility:

```typescript
{
  programVersionId: bigint,
  fieldName: text,                      // "maritalStatus", "numberOfPersons"
  operator: enum,                       // 'equals', 'greater_than', 'in', etc.
  value: jsonb,                         // Comparison value(s)
  description: text?,                   // Human-readable
  displayOrder: integer
}
```

**Example Criteria**:

```json
[
  {
    "fieldName": "maritalStatus",
    "operator": "equals",
    "value": "married",
    "description": "Must be married"
  },
  {
    "fieldName": "numberOfPersons",
    "operator": "greater_or_equal",
    "value": 5,
    "description": "Household of 5 or more"
  }
]
```

**Evaluation**: Application logic evaluates these rules against application data

#### Document Type (`document_type`)

Flexible document categorization:

```typescript
{
  id: bigserial,
  name: text,                           // "national_id", "proof_of_residence"
  description: text?,
  isSystemDefined: boolean,             // true for predefined types
  createdByUserId: ulid?,
  archivedAt: timestamp?
}
```

**System-Defined Types** (seeded during migration):

- national_id
- proof_of_residence
- bank_statement
- income_verification
- marriage_certificate
- birth_certificate

**Custom Types**: Staff can create additional types as needed

#### Program Document Requirement (`program_document_requirement`)

Links document types to program versions:

```typescript
{
  programVersionId: bigint,
  documentTypeId: bigint,
  isRequired: boolean,
  description: text?,                   // Program-specific instructions
  displayOrder: integer
}
```

**Constraint**: Unique `(programVersionId, documentTypeId)`

### Application Layer

#### Application (`application`)

Core application record:

```typescript
{
  id: bigserial,
  programVersionId: bigint,
  personId: bigint,                     // Who is applying
  beneficiaryAccountId: ulid?,          // NULL for committee-enrolled
  status: enum,                         // Workflow state
  submittedAt: timestamp?,
  submittedByUserId: ulid?,             // Staff member (for committee)
  reviewedByUserId: ulid?,
  reviewedAt: timestamp?,
  approvedByUserId: ulid?,
  approvedAt: timestamp?,
  rejectionReason: text?,
  notes: text?                          // Internal staff notes
}
```

**Status Flow**:

```txt
draft → submitted → under_review → [pending_documents | committee_review] 
  → approved → payment_approved
  
OR → rejected
```

**Self-Enrolled Flow**:

- `beneficiaryAccountId` is set
- `submittedByUserId` is NULL
- Beneficiary submits via portal

**Committee-Enrolled Flow**:

- `beneficiaryAccountId` may be NULL (if person not registered)
- `submittedByUserId` is set (staff/coordinator)
- Not visible in portal until approved (if `program.isVisibleInPortal = false`)

#### Application Document (`application_document`)

Links uploads to applications:

```typescript
{
  applicationId: bigint,
  documentTypeId: bigint,               // What type of document
  uploadId: ulid,                       // The actual file
  status: enum('pending', 'approved', 'rejected'),
  reviewedByUserId: ulid?,
  reviewedAt: timestamp?,
  rejectionReason: text?
}
```

**Document Review Workflow**:

1. Beneficiary/staff uploads document → `status = 'pending'`
2. Staff reviews → sets `status = 'approved'` or `'rejected'`
3. If rejected, can send message to request replacement
4. Application can't be approved until all required documents are approved

### Payment Layer

#### Program Payment Formula (`program_payment_formula`)

Defines calculation rules:

```typescript
{
  programVersionId: bigint,             // One formula per version
  baseAmount: numeric(10,2),
  formulaFields: jsonb,                 // Field-based calculations
  description: text?,
  createdByUserId: ulid
}
```

**Constraint**: Unique `(programVersionId)`

**Formula Structure**:

```json
{
  "baseAmount": 1000.00,
  "formulaFields": [
    {
      "field": "numberOfPersons",
      "multiplier": 100
    },
    {
      "field": "hasSpecialNeeds",
      "bonus": 500
    }
  ]
}
```

**Calculation Example**:

```txt
Input: numberOfPersons = 5, hasSpecialNeeds = true
Result: 1000 + (5 × 100) + 500 = 2000
```

#### Application Calculation (`application_calculation`)

Immutable audit record of calculations:

```typescript
{
  applicationId: bigint,
  formulaUsed: jsonb,                   // Snapshot of formula
  inputValues: jsonb,                   // Actual values at calculation time
  calculatedAmount: numeric,            // Formula result
  finalAmount: numeric,                 // May differ if adjusted
  adjustmentReason: text?,              // Required if amounts differ
  calculatedByUserId: ulid,
  calculatedAt: timestamp
}
```

**Audit Trail**: Never update these records. Create new calculation if recalculated.

**Example Record**:

```json
{
  "formulaUsed": {"baseAmount": 1000, "formulaFields": [...]},
  "inputValues": {"numberOfPersons": 5, "maritalStatus": "married"},
  "calculatedAmount": 1500.00,
  "finalAmount": 1800.00,
  "adjustmentReason": "Special circumstances: recent medical expenses"
}
```

#### Payment (`payment`)

Actual payment records:

```typescript
{
  id: bigserial,
  personId: bigint,                     // Who received payment (required)
  applicationId: bigint?,               // Can be NULL for ad-hoc
  programVersionId: bigint?,            // For reporting
  amount: numeric(10,2),
  paymentMethod: enum('eft', 'check', 'coupon', 'card', 'other'),
  paymentDate: date,
  status: enum('pending', 'processing', 'completed', 'failed', 'cancelled'),
  receiverName: text?,                  // Who physically received
  receiverSignatureUploadId: ulid?,    // Signature document
  referenceNumber: text?,               // Check #, transaction ID
  bankAccountLast4: char(4)?,
  notes: text?,
  recordedByUserId: ulid
}
```

**Flexible Linking**:

- `applicationId` can be NULL → ad-hoc payment not tied to application
- Staff can record payments for any person, even without application
- Multiple payments can link to same application (installments)

**Status Management**:

- `pending`: Payment authorized but not yet processed
- `processing`: Payment in progress
- `completed`: Payment successfully delivered
- `failed`: Payment failed, may need retry
- `cancelled`: Payment cancelled/reversed

### Organization Layer

#### Organization Type (`organization_type`)

Flexible categorization:

```typescript
{
  id: bigserial,
  name: text,
  description: text?,
  isSystemDefined: boolean,
  archivedAt: timestamp?
}
```

**System-Defined Types** (seeded):

- synagogue
- chabad_house
- kollel
- local_community
- womens_club
- other

#### Organization (`organization`)

Community organizations:

```typescript
{
  id: bigserial,
  name: text,
  organizationTypeId: bigint,
  organizationNumber: text?,            // Government registration
  addressLine1, addressLine2, city, postalCode,
  phone, email,
  archivedAt: timestamp?
}
```

#### Coordinator (`coordinator`)

Links people to organizations they coordinate:

```typescript
{
  organizationId: bigint,
  personId: bigint,                     // Coordinator as person
  userId: ulid?,                        // Dashboard access if granted
  startDate: date,
  endDate: date?
}
```

**Constraint**: Unique `(organizationId, personId)` where `endDate IS NULL`

**Dashboard Access**:

- If `userId` is set, coordinator can log into dashboard
- Can submit applications on behalf of organization
- Can create committee recommendations

#### Committee Member (`committee_member`)

Committee members per coordinator:

```typescript
{
  coordinatorId: bigint,
  personId: bigint,
  position: text?,                      // "Chair", "Member 1", etc.
  startDate: date,
  endDate: date?
}
```

**Typically**: 3 committee members per coordinator

### Communication Layer

#### Message (`message`)

Flat messaging system with typed messages:

```typescript
{
  id: bigserial,
  messageType: enum,                    // Hardcoded types for UI handling
  recipientType: enum('specific_beneficiary', 'all_beneficiaries', 'staff_internal'),
  recipientBeneficiaryAccountId: ulid?,
  applicationId: bigint?,               // Context
  senderUserId: ulid?,
  subject: text?,
  body: text,
  metadata: jsonb?,                     // Type-specific data
  readAt: timestamp?,
  archivedAt: timestamp?
}
```

**Message Types**:

- `general`: Standard message
- `document_request`: Request documents (metadata: `{requested_documents: [id1, id2]}`)
- `input_request`: Request info (metadata: `{requested_fields: ["field1", "field2"]}`)
- `status_update`: Application status change
- `approval_notice`: Application approved
- `rejection_notice`: Application rejected
- `payment_notice`: Payment processed
- `system_announcement`: Broadcast to all

**Metadata Examples**:

```json
// Document request
{
  "requested_documents": ["national_id", "proof_of_residence"],
  "deadline": "2026-03-15"
}

// Input request
{
  "requested_fields": ["bankAccountNo", "bankBranchNo"],
  "instructions": "Please provide your bank account details"
}
```

**Query Patterns**:

```sql
-- Unread messages for beneficiary
SELECT * FROM message 
WHERE recipientBeneficiaryAccountId = ? 
  AND readAt IS NULL 
  AND archivedAt IS NULL
ORDER BY createdAt DESC

-- Broadcast messages
SELECT * FROM message
WHERE recipientType = 'all_beneficiaries'
  AND archivedAt IS NULL
ORDER BY createdAt DESC
```

### Recommendation Layer

#### Application Recommendation (`application_recommendation`)

Committee recommendations:

```typescript
{
  applicationId: bigint,
  recommendedByUserId: ulid,            // Coordinator/committee member
  recommendedAmount: numeric(10,2),
  recommendationDate: timestamp,
  notes: text?,
  status: enum('pending', 'accepted', 'rejected', 'modified'),
  reviewedByUserId: ulid?,
  reviewedAt: timestamp?
}
```

**Workflow**:

1. Committee member submits recommendation → `status = 'pending'`
2. Staff reviews:
   - Accepts as-is → `status = 'accepted'`
   - Rejects → `status = 'rejected'`
   - Modifies amount → `status = 'modified'`, creates new `application_calculation`

## Data Flow Patterns

### Self-Enrolled Application Flow

```txt
1. Beneficiary Registration
   └─> INSERT beneficiary_account (status='pending')
   └─> Person already exists OR create person record

2. Account Approval
   └─> UPDATE beneficiary_account SET status='approved', approvedBy=staffUserId

3. Application Creation (Portal)
   └─> INSERT application (beneficiaryAccountId SET, status='draft')

4. Document Upload
   └─> INSERT upload (uploadedByBeneficiaryAccountId SET)
   └─> INSERT application_document (applicationId, documentTypeId, uploadId)

5. Application Submission
   └─> UPDATE application SET status='submitted', submittedAt=NOW()
   └─> Optional: INSERT message (type='status_update')

6. Staff Review
   └─> UPDATE application SET status='under_review', reviewedByUserId=?
   └─> Review documents: UPDATE application_document SET status='approved'/'rejected'
   └─> If documents needed: 
       └─> UPDATE application SET status='pending_documents'
       └─> INSERT message (type='document_request', metadata={...})

7. Calculation
   └─> SELECT formula FROM program_payment_formula WHERE programVersionId=?
   └─> Calculate based on application data + formula
   └─> INSERT application_calculation (formulaUsed, inputValues, calculatedAmount, finalAmount)

8. Approval
   └─> UPDATE application SET status='approved', approvedByUserId=?, approvedAt=NOW()
   └─> INSERT message (type='approval_notice')

9. Payment Recording
   └─> INSERT payment (personId, applicationId, amount, ...)
   └─> UPDATE application SET status='payment_approved'
   └─> INSERT message (type='payment_notice')
```

### Committee-Enrolled Application Flow

```txt
1. Coordinator Identifies Beneficiary
   └─> Check if person exists: SELECT * FROM person WHERE nationalId=?
   └─> If not: INSERT person (...)

2. Application Creation (Dashboard)
   └─> INSERT application (
         personId=?,
         beneficiaryAccountId=NULL,
         submittedByUserId=coordinatorUserId,
         status='submitted'
       )

3. Committee Recommendation
   └─> INSERT application_recommendation (
         applicationId,
         recommendedByUserId=committeeMemberId,
         recommendedAmount,
         status='pending'
       )

4. Staff Review of Recommendation
   └─> UPDATE application_recommendation SET status='accepted'/'rejected'/'modified'
   └─> If accepted: Use recommended amount for calculation
   └─> If modified: Create calculation with adjusted amount

5. Application Approval
   └─> UPDATE application SET status='approved'
   └─> If beneficiary has account:
       └─> INSERT message (recipientBeneficiaryAccountId=?)

6. Payment Recording
   └─> INSERT payment (personId, applicationId, amount, ...)
```

### Household Calculation Flow

```txt
When calculating payments based on household size:

1. Get Current Household
   └─> SELECT h.* FROM household h
       JOIN household_member hm ON h.id = hm.householdId
       WHERE hm.personId = ? AND hm.endDate IS NULL

2. Count Members
   └─> SELECT COUNT(*) FROM household_member
       WHERE householdId = ? AND endDate IS NULL

3. Get Demographics
   └─> SELECT p.*, hm.role 
       FROM household_member hm
       JOIN person p ON hm.personId = p.id
       WHERE hm.householdId = ? AND hm.endDate IS NULL

4. Apply Formula
   └─> Calculate: baseAmount + (memberCount * multiplier)
   └─> INSERT application_calculation with inputValues={'numberOfPersons': memberCount}
```

## Relationships & Joins

### Common Join Patterns

#### Application with Full Context

```typescript
const application = await db.query.Application.findFirst({
  where: eq(Application.id, applicationId),
  with: {
    programVersion: {
      with: {
        program: true,
      },
    },
    person: {
      with: {
        contacts: true,
        addresses: { where: isNull(PersonAddress.endDate) },
      },
    },
    beneficiaryAccount: true,
    documents: {
      with: {
        documentType: true,
        upload: true,
      },
    },
    submittedBy: true,
    reviewedBy: true,
    approvedBy: true,
  },
});
```

#### Person with Household and Family

```typescript
const person = await db.query.Person.findFirst({
  where: eq(Person.id, personId),
  with: {
    contacts: { where: eq(PersonContact.isPrimary, true) },
    addresses: { where: isNull(PersonAddress.endDate) },
    householdMemberships: {
      where: isNull(HouseholdMember.endDate),
      with: {
        household: {
          with: {
            members: {
              where: isNull(HouseholdMember.endDate),
              with: { person: true },
            },
          },
        },
      },
    },
    relationships: {
      with: {
        relatedPerson: true,
      },
    },
  },
});
```

#### Program with Requirements

```typescript
const programVersion = await db.query.ProgramVersion.findFirst({
  where: eq(ProgramVersion.id, versionId),
  with: {
    program: true,
    eligibilityCriteria: {
      orderBy: [asc(EligibilityCriteria.displayOrder)],
    },
    documentRequirements: {
      orderBy: [asc(ProgramDocumentRequirement.displayOrder)],
      with: {
        documentType: true,
      },
    },
    paymentFormula: true,
  },
});
```

## Enums & Type Safety

All enums are defined using `pgEnum` for database-level type safety:

```typescript
// Exported from schema files
export const applicationStatusEnum = pgEnum("application_status", [
  "draft",
  "submitted",
  // ...
]);

// TypeScript type inference
type ApplicationStatus = typeof Application.$inferSelect.status;
// => "draft" | "submitted" | "under_review" | ...

// Usage in queries
await db.update(Application)
  .set({ status: "approved" }) // Type-checked!
  .where(eq(Application.id, id));
```

### Key Enums

- **enrollment_type**: `self_enrolled`, `committee_enrolled`
- **application_status**: 8 states covering full workflow
- **application_document_status**: `pending`, `approved`, `rejected`
- **eligibility_criteria_operator**: 8 operators for comparisons
- **payment_method**: `eft`, `check`, `coupon`, `card`, `other`
- **payment_status**: `pending`, `processing`, `completed`, `failed`, `cancelled`
- **household_member_role**: `head`, `spouse`, `child`, `dependent`, `parent`, `guardian`, `other`
- **message_type**: 8 types for UI handling
- **message_recipient_type**: `specific_beneficiary`, `all_beneficiaries`, `staff_internal`
- **recommendation_status**: `pending`, `accepted`, `rejected`, `modified`

## Indexing Strategy

### Performance Indexes

#### Filtering & Lookups

```sql
-- Fast person lookup by national ID
CREATE INDEX person_national_id_index ON person(national_id);

-- Fast application queries by status
CREATE INDEX application_status_index ON application(status);

-- Fast beneficiary message retrieval
CREATE INDEX message_recipient_beneficiary_account_id_index 
  ON message(recipient_beneficiary_account_id);
```

#### Temporal Queries

```sql
-- Active program versions
CREATE INDEX program_version_start_date_index ON program_version(start_date);
CREATE INDEX program_version_end_date_index ON program_version(end_date);

-- Payment date range queries
CREATE INDEX payment_payment_date_index ON payment(payment_date);
```

#### Foreign Key Indexes

All foreign keys have corresponding indexes for join performance:

```sql
CREATE INDEX application_person_id_index ON application(person_id);
CREATE INDEX application_program_version_id_index ON application(program_version_id);
```

### Unique Constraints

#### Business Logic Constraints

```sql
-- Only one current address per person
CREATE UNIQUE INDEX person_address_person_id_unique 
  ON person_address(person_id) WHERE end_date IS NULL;

-- Only one primary contact per type
CREATE UNIQUE INDEX person_contact_person_id_contact_type_unique
  ON person_contact(person_id, contact_type) WHERE is_primary = true;

-- Only one active spouse relationship
CREATE UNIQUE INDEX person_relationship_person_id_related_person_id_unique
  ON person_relationship(
    LEAST(person_id, related_person_id),
    GREATEST(person_id, related_person_id),
    relationship_type
  ) WHERE relationship_type = 'spouse' AND end_date IS NULL;
```

## Temporal Data Patterns

Many entities use temporal tracking with `startDate` and `endDate`:

### Active Record Pattern

```sql
-- Current records have endDate = NULL
SELECT * FROM household_member
WHERE householdId = ? AND endDate IS NULL
```

### Historical Queries

```sql
-- Who lived in household on specific date?
SELECT * FROM household_member
WHERE householdId = ?
  AND startDate <= '2025-01-01'
  AND (endDate IS NULL OR endDate > '2025-01-01')
```

### Ending Relationships

```sql
-- End a household membership
UPDATE household_member
SET endDate = CURRENT_DATE, endReason = 'Moved out'
WHERE id = ? AND endDate IS NULL
```

### Creating New Records

```sql
-- Always check no active record exists first
INSERT INTO household_member (householdId, personId, startDate)
SELECT ?, ?, CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM household_member
  WHERE householdId = ? AND personId = ? AND endDate IS NULL
)
```

## Audit Trail Implementation

### Immutable Records

These tables should NEVER be updated after creation:

- `application_calculation`
- `application_recommendation` (except status updates)
- `message` (except readAt, archivedAt)
- `payment` (except status updates)

### Change Tracking

Use separate audit records instead of updates:

```typescript
// DON'T: Update calculation
await db.update(ApplicationCalculation)
  .set({ finalAmount: newAmount })
  .where(eq(ApplicationCalculation.id, calcId));

// DO: Create new calculation record
await db.insert(ApplicationCalculation).values({
  applicationId,
  formulaUsed: previousCalc.formulaUsed,
  inputValues: newInputValues,
  calculatedAmount: newCalculated,
  finalAmount: newFinal,
  adjustmentReason: "Recalculated with updated household size",
  calculatedByUserId: staffId,
});
```

### Timestamp Tracking

All tables include:

```typescript
{
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}
```

## Migration Strategy

### Initial Setup

```bash
# Generate migration
pnpm drizzle-kit generate

# Review generated SQL
cat drizzle/0000_initial.sql

# Apply migration
pnpm drizzle-kit push
```

### Seed Data

Create seed script for system-defined data:

```typescript
// seed-system-data.ts
await db.insert(DocumentType).values([
  { name: 'national_id', isSystemDefined: true, description: 'National ID card or SSN' },
  { name: 'proof_of_residence', isSystemDefined: true, description: 'Utility bill or lease agreement' },
  { name: 'bank_statement', isSystemDefined: true, description: 'Recent bank statement' },
  { name: 'income_verification', isSystemDefined: true, description: 'Pay stubs or income documentation' },
  { name: 'marriage_certificate', isSystemDefined: true, description: 'Official marriage certificate' },
  { name: 'birth_certificate', isSystemDefined: true, description: 'Birth certificate for children' },
]);

await db.insert(OrganizationType).values([
  { name: 'synagogue', isSystemDefined: true },
  { name: 'chabad_house', isSystemDefined: true },
  { name: 'kollel', isSystemDefined: true },
  { name: 'local_community', isSystemDefined: true },
  { name: 'womens_club', isSystemDefined: true },
  { name: 'other', isSystemDefined: true },
]);
```

### Schema Changes

When modifying schema:

1. **Additive Changes** (safe):
   - New tables
   - New nullable columns
   - New indexes

2. **Breaking Changes** (require data migration):
   - Removing columns
   - Changing column types
   - Adding NOT NULL to existing columns

Example migration with data:

```typescript
// migration: add-household-income.ts
await db.schema.Alter('household').addColumn(
  'totalIncome',
  'numeric(10,2)'
);

// Backfill from existing data
await db.execute(sql`
  UPDATE household h
  SET total_income = (
    SELECT COALESCE(SUM(p.income), 0)
    FROM household_member hm
    JOIN person p ON hm.person_id = p.id
    WHERE hm.household_id = h.id AND hm.end_date IS NULL
  )
`);
```

## Query Patterns

### Efficient Pagination

```typescript
// Cursor-based pagination for applications
const applications = await db.query.Application.findMany({
  where: and(
    eq(Application.status, 'submitted'),
    cursorId ? lt(Application.id, cursorId) : undefined
  ),
  limit: 20,
  orderBy: [desc(Application.createdAt)],
  with: {
    person: true,
    programVersion: { with: { program: true } },
  },
});
```

### Aggregations

```typescript
// Payment totals by program version
const paymentSummary = await db
  .select({
    programVersionId: Payment.programVersionId,
    totalAmount: sql<number>`SUM(${Payment.amount})`,
    paymentCount: sql<number>`COUNT(*)`,
    status: Payment.status,
  })
  .from(Payment)
  .where(eq(Payment.programVersionId, versionId))
  .groupBy(Payment.programVersionId, Payment.status);
```

### Complex Filters

```typescript
// Applications needing review with specific criteria
const needsReview = await db.query.Application.findMany({
  where: and(
    inArray(Application.status, ['submitted', 'under_review']),
    gte(Application.submittedAt, thirtyDaysAgo),
    isNull(Application.reviewedByUserId)
  ),
  with: {
    person: true,
    programVersion: true,
    documents: {
      where: eq(ApplicationDocument.status, 'pending'),
    },
  },
  orderBy: [asc(Application.submittedAt)],
});
```

### Subqueries for Filtering

```typescript
// Programs with active versions
const activePrograms = await db
  .select()
  .from(Program)
  .where(
    exists(
      db.select().from(ProgramVersion)
        .where(
          and(
            eq(ProgramVersion.programId, Program.id),
            eq(ProgramVersion.isActive, true),
            lte(ProgramVersion.startDate, new Date()),
            gte(ProgramVersion.endDate, new Date())
          )
        )
    )
  );
```

## Best Practices

### 1. Always Use Transactions for Multi-Step Operations

```typescript
await db.transaction(async (tx) => {
  // Create application
  const [application] = await tx.insert(Application)
    .values({ ... })
    .returning();

  // Create calculation
  await tx.insert(ApplicationCalculation)
    .values({ applicationId: application.id, ... });

  // Update status
  await tx.update(Application)
    .set({ status: 'approved' })
    .where(eq(Application.id, application.id));
});
```

### 2. Check Temporal Constraints

```typescript
// Before creating household membership
const existing = await db.query.HouseholdMember.findFirst({
  where: and(
    eq(HouseholdMember.householdId, householdId),
    eq(HouseholdMember.personId, personId),
    isNull(HouseholdMember.endDate)
  ),
});

if (existing) {
  throw new Error("Person already has active household membership");
}
```

### 3. Use Type Inference

```typescript
// Let Drizzle infer types
type Application = typeof Application.$inferSelect;
type NewApplication = typeof Application.$inferInsert;

// Use in functions
async function createApplication(data: NewApplication): Promise<Application> {
  const [application] = await db.insert(Application)
    .values(data)
    .returning();
  return application;
}
```

### 4. Optimize Eager Loading

```typescript
// DON'T: N+1 queries
const applications = await db.query.Application.findMany();
for (const app of applications) {
  const person = await db.query.Person.findFirst({
    where: eq(Person.id, app.personId),
  });
}

// DO: Eager load with 'with'
const applications = await db.query.Application.findMany({
  with: { person: true },
});
```

### 5. Handle Soft Deletes

```typescript
// Always filter out archived records
const activePrograms = await db.query.Program.findMany({
  where: isNull(Program.archivedAt),
});

// Soft delete instead of hard delete
await db.update(Program)
  .set({ archivedAt: new Date() })
  .where(eq(Program.id, programId));
```

### 6. Validate Before Insert

```typescript
// Check eligibility criteria before creating application
async function validateEligibility(
  personId: number,
  programVersionId: number
): Promise<boolean> {
  const criteria = await db.query.EligibilityCriteria.findMany({
    where: eq(EligibilityCriteria.programVersionId, programVersionId),
  });

  const person = await getPersonWithHousehold(personId);

  for (const rule of criteria) {
    if (!evaluateCriterion(person, rule)) {
      return false;
    }
  }

  return true;
}
```

### 7. Use Prepared Statements for Repeated Queries

```typescript
const getApplicationById = db.query.Application.findFirst({
  where: eq(Application.id, sql.placeholder('id')),
  with: {
    person: true,
    programVersion: { with: { program: true } },
  },
}).prepare('get_application_by_id');

// Reuse
const app1 = await getApplicationById.execute({ id: 1 });
const app2 = await getApplicationById.execute({ id: 2 });
```

### 8. Document Complex Business Logic

```typescript
/**
 * Creates a new household membership, automatically ending any previous
 * membership for the same person in a different household.
 * 
 * Business Rule: A person can only be in one household at a time.
 * 
 * @param personId - The person to add
 * @param householdId - The household to add them to
 * @param role - Their role in the household
 * @throws Error if person already in this household
 */
async function addToHousehold(
  personId: number,
  householdId: number,
  role: HouseholdMemberRole
) {
  await db.transaction(async (tx) => {
    // End previous memberships
    await tx.update(HouseholdMember)
      .set({ endDate: new Date(), endReason: 'Moved to new household' })
      .where(
        and(
          eq(HouseholdMember.personId, personId),
          isNull(HouseholdMember.endDate)
        )
      );

    // Create new membership
    await tx.insert(HouseholdMember).values({
      householdId,
      personId,
      role,
      startDate: new Date(),
    });
  });
}
```

## Development Workflow

### Local Development

```bash
# Install dependencies
pnpm install

# Start PostgreSQL (Docker)
docker run -d \
  --name congress-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=congress \
  -p 5432:5432 \
  postgres:14

# Generate types
pnpm drizzle-kit generate

# Push schema
pnpm drizzle-kit push

# Run seed
pnpm seed
```

### Schema Updates

```bash
# 1. Modify schema files
# 2. Generate migration
pnpm drizzle-kit generate

# 3. Review SQL
cat drizzle/migrations/XXXX_migration_name.sql

# 4. Apply
pnpm drizzle-kit push

# 5. Update seed if needed
pnpm seed
```

### Type Checking

```bash
# Check types
pnpm typecheck

# Build package
pnpm build
```

## Troubleshooting

### Common Issues

**Issue**: Foreign key constraint violation

```txt
Error: insert or update on table "application" violates foreign key constraint
```

**Solution**: Ensure referenced records exist before inserting. Use transactions for dependent inserts.

**Issue**: Unique constraint violation on temporal data

```txt
Error: duplicate key value violates unique constraint "household_member_household_id_person_id_unique"
```

**Solution**: Check for existing active records before inserting. End previous record first.

**Issue**: Enum type mismatch

```txt
Error: invalid input value for enum application_status: "Approved"
```

**Solution**: Use exact enum values (lowercase, underscores): `"approved"` not `"Approved"`

### Debugging Queries

```typescript
// Enable query logging
import { drizzle } from 'drizzle-orm/node-postgres';

const db = drizzle(pool, {
  logger: {
    logQuery: (query, params) => {
      console.log('Query:', query);
      console.log('Params:', params);
    },
  },
});
```

## Performance Monitoring

### Key Metrics to Monitor

1. **Query Performance**
   - Application list queries (<100ms target)
   - Person lookup by national ID (<10ms target)
   - Program version with requirements (<50ms target)

2. **Index Usage**
   - Monitor unused indexes: `pg_stat_user_indexes`
   - Check for sequential scans on large tables

3. **Table Growth**
   - `application`, `payment`, `message` will grow rapidly
   - Plan archival strategy for old data

4. **Lock Contention**
   - Monitor for lock waits on high-traffic tables
   - Consider partitioning for very large tables

### Optimization Queries

```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND indexname NOT LIKE '%_pkey';

-- Table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::text))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::text) DESC;
```

---

## Summary

This database schema provides a solid foundation for a flexible, scalable beneficiary management system. Key design principles:

✅ **Normalized** - Eliminates redundancy while maintaining performance
✅ **Temporal** - Tracks changes over time with proper date ranges
✅ **Auditable** - Complete audit trails for financial calculations
✅ **Flexible** - Extensible types and metadata fields
✅ **Type-Safe** - Full TypeScript inference from schema
✅ **Performant** - Strategic indexes and query patterns

For questions or contributions, refer to the main repository documentation.
