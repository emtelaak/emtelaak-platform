# Phase 2: Multi-Stage Approval and Compliance - Implementation Plan

**Start Date**: Current
**Estimated Duration**: 12 weeks (compressed to iterative development)
**Status**: In Progress

---

## Overview

Phase 2 enhances the basic approval workflow from Phase 1 into a comprehensive multi-stage approval system with:
- **Sequential approval stages** (Initial → Financial → Legal → Compliance → Executive)
- **Specialized reviewer roles** with permissions and workload management
- **Compliance checks** and automated validation
- **Change request management** with tracking
- **Comprehensive audit trails** for all activities

---

## Implementation Strategy

We'll implement this in **8 major milestones**, building incrementally and testing as we go:

### Milestone 1: Database Schema (Days 1-3)
- [ ] Design approval workflow tables
- [ ] Design reviewer management tables
- [ ] Design compliance checks tables
- [ ] Create and test migrations
- [ ] Verify schema integrity

### Milestone 2: Reviewer Role System (Days 4-7)
- [ ] Extend user roles to include reviewer types
- [ ] Implement reviewer assignment logic
- [ ] Create reviewer permissions system
- [ ] Build reviewer workload tracking
- [ ] Test role-based access control

### Milestone 3: Approval Workflow Engine (Days 8-12)
- [ ] Implement workflow state machine
- [ ] Create stage transition logic
- [ ] Build automatic reviewer assignment
- [ ] Implement notification triggers
- [ ] Test workflow progression

### Milestone 4: Review Comments & Feedback (Days 13-16)
- [ ] Design comment threading system
- [ ] Implement inline commenting on sections
- [ ] Create comment resolution tracking
- [ ] Build comment notifications
- [ ] Test comment functionality

### Milestone 5: Change Request Management (Days 17-20)
- [ ] Create change request data model
- [ ] Implement change request workflow
- [ ] Build change request tracking
- [ ] Create impact analysis tools
- [ ] Test change request lifecycle

### Milestone 6: Compliance Validation Engine (Days 21-26)
- [ ] Design compliance rule structure
- [ ] Implement rule evaluation engine
- [ ] Create Regulation D compliance checks
- [ ] Build document verification logic
- [ ] Create compliance scoring system
- [ ] Test compliance validation

### Milestone 7: Frontend Interfaces (Days 27-35)
- [ ] Build reviewer dashboard
- [ ] Create multi-stage review interface
- [ ] Implement inline commenting UI
- [ ] Build change request interface
- [ ] Create compliance dashboard
- [ ] Design audit trail viewer

### Milestone 8: Testing & Integration (Days 36-40)
- [ ] End-to-end workflow testing
- [ ] Compliance check validation
- [ ] Performance testing
- [ ] User acceptance testing
- [ ] Documentation and training materials

---

## Detailed Task Breakdown

## 1. DATABASE SCHEMA ENHANCEMENT

### 1.1 Approval Stages Table
```sql
CREATE TABLE approval_stages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  sequence_order INT NOT NULL,
  required_role VARCHAR(50) NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,
  skip_conditions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.2 Reviewer Assignments Table
```sql
CREATE TABLE reviewer_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  offering_id INT NOT NULL,
  stage_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INT,
  status ENUM('pending', 'in_progress', 'completed', 'skipped'),
  completed_at TIMESTAMP,
  FOREIGN KEY (offering_id) REFERENCES offerings(id),
  FOREIGN KEY (stage_id) REFERENCES approval_stages(id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id)
);
```

### 1.3 Review Comments Table
```sql
CREATE TABLE review_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  offering_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  stage_id INT,
  section VARCHAR(100),
  comment_text TEXT NOT NULL,
  parent_comment_id INT,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolved_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (offering_id) REFERENCES offerings(id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id),
  FOREIGN KEY (parent_comment_id) REFERENCES review_comments(id)
);
```

### 1.4 Change Requests Table
```sql
CREATE TABLE change_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  offering_id INT NOT NULL,
  requested_by INT NOT NULL,
  stage_id INT,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  priority ENUM('low', 'medium', 'high', 'critical'),
  status ENUM('open', 'in_progress', 'resolved', 'rejected'),
  impact_assessment TEXT,
  resolved_at TIMESTAMP,
  resolved_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (offering_id) REFERENCES offerings(id),
  FOREIGN KEY (requested_by) REFERENCES users(id)
);
```

### 1.5 Compliance Checks Table
```sql
CREATE TABLE compliance_checks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  offering_id INT NOT NULL,
  check_type VARCHAR(100) NOT NULL,
  check_category ENUM('regulatory', 'documentation', 'disclosure', 'financial'),
  rule_name VARCHAR(200) NOT NULL,
  rule_description TEXT,
  check_result ENUM('pass', 'fail', 'warning', 'not_applicable'),
  result_details JSON,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  checked_by INT,
  FOREIGN KEY (offering_id) REFERENCES offerings(id)
);
```

### 1.6 Workflow Audit Log Table
```sql
CREATE TABLE workflow_audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  offering_id INT NOT NULL,
  user_id INT NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  action_details JSON,
  stage_id INT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (offering_id) REFERENCES offerings(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 2. BACKEND API DEVELOPMENT

### 2.1 Approval Workflow Engine

**Endpoints:**
- `workflows.getStages` - Get all approval stages
- `workflows.getCurrentStage` - Get current stage for offering
- `workflows.advanceStage` - Move to next stage
- `workflows.skipStage` - Skip optional stage
- `workflows.getWorkflowHistory` - Get complete workflow history

**Key Logic:**
- State machine for stage transitions
- Validation before stage advancement
- Automatic reviewer assignment based on role
- Notification triggers for stage changes

### 2.2 Reviewer Management API

**Endpoints:**
- `reviewers.assign` - Assign reviewer to stage
- `reviewers.getAssignments` - Get reviewer's assignments
- `reviewers.getWorkload` - Get reviewer workload stats
- `reviewers.updateStatus` - Update review status

**Key Logic:**
- Role-based reviewer assignment
- Workload balancing algorithm
- Availability tracking
- Permission enforcement

### 2.3 Review Comments API

**Endpoints:**
- `comments.create` - Create new comment
- `comments.reply` - Reply to comment
- `comments.resolve` - Mark comment as resolved
- `comments.getByOffering` - Get all comments for offering
- `comments.getBySection` - Get comments for specific section

**Key Logic:**
- Comment threading
- Section-specific commenting
- Resolution tracking
- Notification system

### 2.4 Change Request Management API

**Endpoints:**
- `changeRequests.create` - Create change request
- `changeRequests.update` - Update change request
- `changeRequests.resolve` - Resolve change request
- `changeRequests.getByOffering` - Get change requests for offering
- `changeRequests.getPrioritized` - Get prioritized list

**Key Logic:**
- Priority assignment
- Status tracking
- Impact analysis
- Resolution workflow

### 2.5 Compliance Validation Engine

**Endpoints:**
- `compliance.runChecks` - Run all compliance checks
- `compliance.getResults` - Get compliance check results
- `compliance.getScore` - Get compliance score
- `compliance.generateReport` - Generate compliance report

**Key Logic:**
- Configurable rule engine
- Regulation D compliance checks
- Document completeness verification
- Scoring algorithm

### 2.6 Audit Trail API

**Endpoints:**
- `audit.log` - Log activity (internal)
- `audit.getByOffering` - Get audit trail for offering
- `audit.getByUser` - Get user activity log
- `audit.export` - Export audit trail

**Key Logic:**
- Comprehensive activity logging
- Query and filtering
- Export functionality

---

## 3. FRONTEND DEVELOPMENT

### 3.1 Reviewer Dashboard
- Assigned offerings list
- Review status indicators
- Workload overview
- Quick access to review actions
- Deadline tracking

### 3.2 Multi-Stage Review Interface
- Visual workflow progress
- Stage-by-stage review
- Stage completion checklist
- Stage transition controls
- Review history timeline

### 3.3 Inline Commenting System
- Click-to-comment on sections
- Comment threading
- Resolve/unresolve comments
- Comment filtering
- Notification badges

### 3.4 Change Request Interface
- Create change request form
- Change request list
- Priority indicators
- Status tracking
- Resolution workflow

### 3.5 Compliance Dashboard
- Compliance check results
- Compliance score visualization
- Issue highlighting
- Detailed check results
- Compliance report download

### 3.6 Audit Trail Viewer
- Activity timeline
- Filter by user/action/date
- Detailed activity drill-down
- Export to CSV/PDF

---

## 4. COMPLIANCE RULES DEFINITION

### 4.1 Regulation D 506(c) Checks
- [ ] Accredited investor verification requirement
- [ ] General solicitation compliance
- [ ] Form D filing requirement
- [ ] Disclosure document completeness
- [ ] Bad actor disqualification check

### 4.2 Document Verification
- [ ] PPM (Private Placement Memorandum) present
- [ ] Subscription Agreement present
- [ ] Operating Agreement present
- [ ] Financial Statements present
- [ ] Property Appraisal present

### 4.3 Financial Validation
- [ ] Offering amount within regulatory limits
- [ ] Fee structure disclosed
- [ ] Financial projections reasonable
- [ ] Use of proceeds documented
- [ ] Risk factors disclosed

---

## 5. TESTING STRATEGY

### 5.1 Unit Tests
- Workflow state machine logic
- Compliance rule evaluation
- Comment threading
- Change request workflow
- Audit logging

### 5.2 Integration Tests
- End-to-end approval workflow
- Reviewer assignment and notification
- Compliance check execution
- Audit trail completeness

### 5.3 User Acceptance Tests
- Reviewer workflow scenarios
- Compliance validation accuracy
- Change request management
- Audit trail verification

---

## Success Metrics

- [ ] Average approval time < 5 business days
- [ ] 100% compliance check coverage
- [ ] Zero missed audit log entries
- [ ] Reviewer satisfaction > 4/5
- [ ] Change request resolution time < 2 days

---

## Next Steps

1. Review and approve this plan
2. Begin Milestone 1: Database Schema
3. Implement incrementally with testing
4. Gather feedback and iterate
5. Complete Phase 2 and save checkpoint
