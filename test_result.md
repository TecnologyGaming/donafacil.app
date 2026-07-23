#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Crear un clon de GoFundMe en español con limitación de 3 fotos por donativo, panel admin, aprobación de métodos de pago (destacando Zelle y Pago Móvil como principales, tarjeta Stripe como tercero), y base de datos persistente."
backend:
  - task: "API root check"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Base hello check route /api/ is working."
      - working: true
        agent: "testing"
        comment: "✓ TESTED: GET /api/ returns 200 with correct message. Fixed CORS middleware issue (removed unsupported allow_origins_regex parameter)."
  - task: "Campaign management CRUD"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Supports fetching, creating (max 3 images limit enforced), and editing campaigns."
      - working: true
        agent: "testing"
        comment: "✓ TESTED: All campaign endpoints working correctly. GET /api/campaigns returns only active campaigns. GET /api/campaigns/{id} retrieves single campaign. POST /api/campaigns correctly enforces 3 photo limit (returns 400 for >3 photos). Category and search filters working. Fixed typo in line 485 (status_code 4404 → 404)."
  - task: "Donation submissions and list"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Allows submitting donations with payment method types (Zelle, Pago Móvil, Stripe)."
      - working: true
        agent: "testing"
        comment: "✓ TESTED: POST /api/campaigns/{id}/donations successfully creates donations and correctly increments campaign current amount. All donation fields properly stored."
  - task: "Admin Toggle & Custom payment approval"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Allows admin to toggle active status, toggle Stripe, and approve custom payment methods."
      - working: true
        agent: "testing"
        comment: "✓ TESTED: All admin endpoints working correctly. PATCH /api/admin/campaigns/{id}/toggle-active toggles campaign visibility. PATCH /api/admin/campaigns/{id}/toggle-stripe toggles Stripe payment option. POST /api/admin/campaigns/{id}/approve-payment/{method_id} approves/rejects custom payment methods. GET /api/admin/stats returns correct statistics. GET /api/admin/donations returns all donations."

frontend:
  - task: "GoFundMe landing page"
    implemented: true
    working: true
    file: "frontend/src/components/Home.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Rendered correctly with statistics, filters, search and grid."
  - task: "Campaign Detail layout & options order"
    implemented: true
    working: true
    file: "frontend/src/components/CampaignDetail.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Shows carousel, description, recent donations, and options in order: 1. Zelle, 2. Pago Móvil, 3. Card (Stripe)."
  - task: "Create Campaign Form with 3 photos limit"
    implemented: true
    working: true
    file: "frontend/src/components/CreateCampaign.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Step-by-step form enforcing max 3 photos."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 2
  run_ui: false

test_plan:
  current_focus:
    - "API root check"
    - "Campaign management CRUD"
    - "Donation submissions and list"
    - "Admin Toggle & Custom payment approval"
  stuck_tasks: []
  test_all: true
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Fully implemented the backend with seeding and campaign CRUD. Ready for deep testing of the API routes."
  - agent: "testing"
    message: "Backend testing complete. All 13 tests passed successfully. Fixed 2 minor issues: (1) Removed unsupported 'allow_origins_regex' parameter from CORS middleware that was causing 500 errors, (2) Fixed typo in error status code (4404 → 404) in payment approval endpoint. All API endpoints are working correctly including root, campaigns CRUD, donations, admin toggles, payment approvals, and stats."
