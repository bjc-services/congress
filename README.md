# Congress Beneficiary Management System

A comprehensive dual-platform system for managing charitable assistance programs, beneficiary applications, and community coordination. The system enables organizations to efficiently manage grant programs, track beneficiaries, coordinate with community organizations, and maintain transparency throughout the assistance lifecycle.

## Overview

The Congress Beneficiary Management System is designed to streamline the administration of charitable assistance programs while providing beneficiaries with a transparent, user-friendly portal to access services. The platform serves two primary audiences through distinct interfaces:

1. **Beneficiary Portal** - A self-service platform for beneficiaries to apply for programs, upload documents, track application status, and receive communications
2. **Dashboard** - An administrative platform for staff to manage programs, review applications, coordinate with community organizations, process payments, and maintain beneficiary records

## Core Concepts

### Programs and Versions

Programs represent ongoing assistance initiatives that can be run repeatedly over time. Each program has specific eligibility criteria, document requirements, and payment formulas.

**Program Versions** are time-bound instances of programs. For example:
- Program: "Avrechim Grant"
  - Version: "Pesach 2026" (March 1 - April 15, 2026)
  - Version: "Chanukah 2026" (November 1 - December 15, 2026)

Each version has:
- Defined enrollment period (start and end dates)
- Specific eligibility criteria
- Document requirements
- Payment calculation formulas
- Active/inactive status

### Enrollment Types

Programs support two enrollment models:

#### Self-Enrolled Programs
Beneficiaries can independently:
- View program details and eligibility criteria
- Submit applications through the beneficiary portal
- Upload required documents
- Track application status
- Receive notifications and communications

#### Committee-Enrolled Programs
Staff or committee members submit applications on behalf of beneficiaries:
- Applications are created by coordinators or committee members
- Often used for elderly or non-technical beneficiaries
- Not visible in the beneficiary portal until approved
- Beneficiaries are notified of approved grants

## Key Features

### For Beneficiaries

#### Application Management
- **Program Discovery**: View available programs with eligibility criteria and requirements
- **Self-Service Applications**: Complete and submit applications online
- **Document Upload**: Securely upload required documents (ID, bank statements, proof of residence, etc.)
- **Status Tracking**: Real-time visibility into application review status
- **Communication**: Receive and respond to messages from staff

#### Account Management
- Secure signup with national ID and phone verification
- Account approval workflow with staff review
- Login authentication with session management
- Profile management linked to person records

### For Administrative Staff

#### Program Management
- **Program Creation**: Define new programs with templates
- **Version Management**: Create time-bound versions with enrollment periods
- **Eligibility Configuration**: Set field-based criteria (e.g., "married AND numberOfPersons >= 5")
- **Document Requirements**: Specify required and optional documents per program
- **Payment Formulas**: Configure calculation rules with base amounts and multipliers

#### Application Review Workflow
Applications move through defined states:
1. **Draft** - Initial creation, not yet submitted
2. **Submitted** - Application received, awaiting review
3. **Under Review** - Staff actively reviewing
4. **Pending Documents** - Additional documents requested
5. **Committee Review** - Under committee evaluation
6. **Approved** - Application approved, payment pending
7. **Rejected** - Application rejected with reason
8. **Payment Approved** - Payment authorized and recorded

Staff can:
- Review applications and uploaded documents
- Request additional documents or information
- Calculate suggested payment amounts using formulas
- Adjust amounts with justification
- Approve or reject applications
- Record final payment details

#### Payment Management

**Flexible Payment Recording**:
- Link payments to specific applications
- Record ad-hoc payments without application linkage
- Support multiple payment methods (EFT, check, coupon, card)
- Track payment status (pending, processing, completed, failed, cancelled)
- Maintain audit trail with staff attribution

**Payment Calculation**:
- Formula-based calculation with field inputs
- Automatic computation based on household size, marital status, etc.
- Staff override capability with adjustment reasons
- Complete audit trail capturing:
  - Formula used at time of calculation
  - Input values
  - Calculated amount
  - Final amount (if adjusted)
  - Adjustment reason

### Organization & Community Management

#### Organizations
Manage community organizations that coordinate assistance:
- Flexible organization types (synagogue, chabad house, kollel, local community, women's club, other)
- Contact information and location tracking
- Government registration numbers
- Archive/restore functionality

#### Coordinators
Community coordinators serve as liaisons:
- Linked to specific organizations
- Optional dashboard access for direct submission
- Time-tracked assignments (start/end dates)
- Manage committee members

#### Committee Members
Support coordinators in application review:
- Typically 3 members per coordinator
- Submit recommendations with suggested amounts
- Review workflow for staff approval of recommendations

### Communications System

**Message Types** (handled specially by the UI):
- **General** - Standard communications
- **Document Request** - Request specific documents with metadata
- **Input Request** - Request additional information/form fields
- **Status Update** - Notify about application progress
- **Approval Notice** - Application approved notification
- **Rejection Notice** - Application rejected with reason
- **Payment Notice** - Payment processed notification
- **System Announcement** - Broadcast messages to all beneficiaries

**Message Recipients**:
- Specific beneficiary (linked to account)
- All beneficiaries (broadcast)
- Staff internal (not visible to beneficiaries)

Messages can be linked to applications for context and include structured metadata for UI handling (e.g., list of requested documents).

### Household & Family Management

The system maintains a comprehensive directory structure:

#### Households
Groups of people living together, separate from family relationships:
- Primary address linkage
- Household membership tracking over time
- Member roles (head, spouse, child, dependent, parent, guardian, other)
- One primary member per household
- Historical tracking (who lived where when)

#### Family Relationships
Person-to-person relationships:
- Spouse relationships
- Parent-child relationships
- Guardian relationships
- Sibling relationships (implicit through shared parents)
- Time-tracked with start/end dates
- Relationship type preservation

This dual structure allows:
- Accurate household composition for eligibility
- Family tree navigation
- Support for complex scenarios (elderly parent living with non-relative caregiver)
- Historical household changes (divorce, children moving out, etc.)

### Person Records

Centralized person management:
- National ID (unique identifier)
- Basic demographics (name, date of birth, gender)
- Multiple contact methods (phone, email) with primary designation
- Address history with time tracking
- Links to beneficiary accounts (if registered)
- Relationship and household connections

## Program Workflows

### Self-Enrolled Application Flow

1. **Beneficiary Registration**
   - Signs up with national ID and phone
   - Creates password
   - Account enters "pending" status
   - Staff reviews and approves account

2. **Program Discovery**
   - Beneficiary views available programs
   - Reviews eligibility criteria
   - Checks document requirements

3. **Application Submission**
   - Completes application form
   - Uploads required documents
   - Submits for review

4. **Staff Review**
   - Reviews application and documents
   - May request additional documents/information
   - Calculates suggested payment amount
   - Approves or rejects

5. **Payment Processing**
   - Records payment details
   - Generates payment records
   - Notifies beneficiary

### Committee-Enrolled Application Flow

1. **Committee Identification**
   - Coordinator/committee identifies eligible beneficiaries
   - May include non-registered individuals

2. **Application Creation**
   - Staff/coordinator creates application on behalf of beneficiary
   - Enters beneficiary information
   - Uploads documents (if available)

3. **Committee Recommendation**
   - Committee members review case
   - Submit recommended amounts with justification

4. **Staff Review**
   - Reviews committee recommendation
   - Accepts, modifies, or rejects
   - Final approval and payment authorization

5. **Beneficiary Notification**
   - Approved grants visible in portal (if beneficiary has account)
   - Alternative notification methods for non-users

## Data Integrity & Audit

### Normalization
- Document types stored separately (system-defined + custom)
- Organization types stored separately (system-defined + custom)
- Programs separated from versions for reusability
- Clean separation of concerns throughout

### Audit Trails
- **Payment Calculations**: Complete snapshot of formula, inputs, and results
- **Application History**: All status changes tracked with timestamps and staff attribution
- **Document Review**: Document approval/rejection history
- **Recommendations**: Committee recommendation review trail

### Soft Deletes
Important entities use archived timestamps rather than hard deletes:
- Programs
- Document types
- Organization types
- Organizations
- Messages

This preserves historical data integrity while removing items from active use.

### Time-Tracked Relationships
Many entities support temporal tracking:
- Household memberships (people move)
- Coordinators (assignments change)
- Committee members (terms expire)
- Person addresses (people relocate)
- Relationships (marriages, divorces)

## Security & Access Control

### Beneficiary Portal
- Phone number + password authentication
- Account approval by staff required
- Session-based authentication
- Password reset via voice call
- Account lock after failed login attempts
- View only own applications and data

### Dashboard
- Email-based authentication with OAuth support
- Role-based access control
- Session management with IP and user agent tracking
- Impersonation capability for support
- Audit logging of all administrative actions

## Reporting & Analytics

The system structure supports comprehensive reporting:
- Payment summaries by program/version
- Application approval rates and processing times
- Organization effectiveness metrics
- Beneficiary demographics and trends
- Document completion rates
- Committee recommendation accuracy

## Future Extensibility

The normalized, flexible design enables:
- **Multi-tenancy**: Potential to offer as SaaS to other organizations
- **Custom Programs**: Easy addition of new program types
- **Dynamic Workflows**: Configurable application workflows per program
- **Integration Ready**: Clean data model for external system integration
- **Scalable**: Structure supports growth in beneficiaries, programs, and organizations

## System Philosophy

This system embodies several key design principles:

1. **Transparency**: Beneficiaries can see exactly where they are in the process
2. **Flexibility**: Staff can handle edge cases and exceptional situations
3. **Accountability**: Complete audit trails for all decisions and payments
4. **Efficiency**: Automation where appropriate, human judgment where necessary
5. **Dignity**: Respecting beneficiaries while maintaining necessary oversight
6. **Community**: Enabling community organizations to participate in the process
7. **Evolution**: Built to adapt as needs change and grow over time
