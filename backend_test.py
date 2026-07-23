#!/usr/bin/env python3
"""
Backend API Testing for donafacil.app
Tests all endpoints defined in /app/contracts.md
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Backend URL from frontend/.env
BASE_URL = "https://campanaya.preview.emergentagent.com/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_test(name: str, passed: bool, details: str = ""):
    status = f"{Colors.GREEN}✓ PASS{Colors.RESET}" if passed else f"{Colors.RED}✗ FAIL{Colors.RESET}"
    print(f"{status} - {name}")
    if details:
        print(f"  {details}")
    if not passed:
        print()

def print_section(title: str):
    print(f"\n{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BLUE}{title}{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*60}{Colors.RESET}\n")

# Test Results Tracking
test_results = {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "critical_failures": []
}

def record_test(name: str, passed: bool, critical: bool = False):
    test_results["total"] += 1
    if passed:
        test_results["passed"] += 1
    else:
        test_results["failed"] += 1
        if critical:
            test_results["critical_failures"].append(name)

# ============= TEST FUNCTIONS =============

def test_root_endpoint():
    """Test GET /api/"""
    print_section("1. Testing Root Endpoint")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=10)
        passed = response.status_code == 200 and "message" in response.json()
        details = f"Status: {response.status_code}, Response: {response.json()}"
        print_test("GET /api/", passed, details)
        record_test("Root endpoint", passed, critical=True)
        return passed
    except Exception as e:
        print_test("GET /api/", False, f"Error: {str(e)}")
        record_test("Root endpoint", False, critical=True)
        return False

def test_get_campaigns():
    """Test GET /api/campaigns"""
    print_section("2. Testing Campaign List")
    try:
        response = requests.get(f"{BASE_URL}/campaigns", timeout=10)
        passed = response.status_code == 200
        
        if passed:
            campaigns = response.json()
            passed = isinstance(campaigns, list) and len(campaigns) > 0
            details = f"Status: {response.status_code}, Found {len(campaigns)} campaigns"
            
            # Check that only active campaigns are returned
            all_active = all(c.get("isActive", False) for c in campaigns)
            if not all_active:
                passed = False
                details += " | ERROR: Found inactive campaigns in public list"
        else:
            details = f"Status: {response.status_code}"
        
        print_test("GET /api/campaigns", passed, details)
        record_test("Get campaigns list", passed, critical=True)
        return campaigns if passed else []
    except Exception as e:
        print_test("GET /api/campaigns", False, f"Error: {str(e)}")
        record_test("Get campaigns list", False, critical=True)
        return []

def test_get_campaign_by_id(campaign_id: str):
    """Test GET /api/campaigns/{id}"""
    try:
        response = requests.get(f"{BASE_URL}/campaigns/{campaign_id}", timeout=10)
        passed = response.status_code == 200
        
        if passed:
            campaign = response.json()
            passed = campaign.get("id") == campaign_id
            details = f"Status: {response.status_code}, Campaign: {campaign.get('title', 'N/A')}"
        else:
            details = f"Status: {response.status_code}"
        
        print_test(f"GET /api/campaigns/{campaign_id}", passed, details)
        record_test("Get campaign by ID", passed, critical=True)
        return campaign if passed else None
    except Exception as e:
        print_test(f"GET /api/campaigns/{campaign_id}", False, f"Error: {str(e)}")
        record_test("Get campaign by ID", False, critical=True)
        return None

def test_create_campaign():
    """Test POST /api/campaigns with 3 photos limit"""
    print_section("3. Testing Campaign Creation")
    
    # Test 1: Valid campaign with 3 photos
    valid_payload = {
        "title": "Campaña de Prueba - Refugio de Animales",
        "category": "Mascotas",
        "goal": 5000.0,
        "description": "Esta es una campaña de prueba para verificar el sistema de donaciones. Ayudamos a rescatar animales abandonados.",
        "images": [
            "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800",
            "https://images.unsplash.com/photo-1415369629372-26f2fe60c467?w=800",
            "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800"
        ],
        "organizerName": "María González",
        "organizerEmail": "maria.gonzalez@example.com",
        "customPaymentMethods": [
            {"name": "Zelle", "details": "maria.test@zelle.com"},
            {"name": "Pago Móvil", "details": "Banesco (0102) - 0414-9998877 - V-11223344"}
        ]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/campaigns", json=valid_payload, timeout=10)
        passed = response.status_code == 200
        
        if passed:
            campaign = response.json()
            # Verify all fields
            checks = [
                campaign.get("title") == valid_payload["title"],
                campaign.get("goal") == valid_payload["goal"],
                campaign.get("current") == 0.0,
                len(campaign.get("images", [])) == 3,
                campaign.get("isActive") == True,
                len(campaign.get("customPaymentMethods", [])) == 2,
                all(not m.get("approved", True) for m in campaign.get("customPaymentMethods", []))
            ]
            passed = all(checks)
            details = f"Status: {response.status_code}, Campaign ID: {campaign.get('id', 'N/A')}"
            if not all(checks):
                details += " | Some fields validation failed"
        else:
            details = f"Status: {response.status_code}, Response: {response.text[:200]}"
        
        print_test("POST /api/campaigns (valid with 3 photos)", passed, details)
        record_test("Create campaign (valid)", passed, critical=True)
        created_campaign_id = campaign.get("id") if passed else None
    except Exception as e:
        print_test("POST /api/campaigns (valid)", False, f"Error: {str(e)}")
        record_test("Create campaign (valid)", False, critical=True)
        created_campaign_id = None
    
    # Test 2: Invalid campaign with more than 3 photos
    invalid_payload = valid_payload.copy()
    invalid_payload["images"] = [
        "https://images.unsplash.com/photo-1?w=800",
        "https://images.unsplash.com/photo-2?w=800",
        "https://images.unsplash.com/photo-3?w=800",
        "https://images.unsplash.com/photo-4?w=800"
    ]
    invalid_payload["title"] = "Campaña Inválida - Más de 3 Fotos"
    
    try:
        response = requests.post(f"{BASE_URL}/campaigns", json=invalid_payload, timeout=10)
        passed = response.status_code == 400
        details = f"Status: {response.status_code}"
        if passed:
            details += " | Correctly rejected >3 photos"
        else:
            details += " | ERROR: Should reject campaigns with >3 photos"
        
        print_test("POST /api/campaigns (>3 photos rejection)", passed, details)
        record_test("Create campaign (>3 photos validation)", passed, critical=True)
    except Exception as e:
        print_test("POST /api/campaigns (>3 photos)", False, f"Error: {str(e)}")
        record_test("Create campaign (>3 photos validation)", False, critical=True)
    
    return created_campaign_id

def test_create_donation(campaign_id: str):
    """Test POST /api/campaigns/{id}/donations"""
    print_section("4. Testing Donation Submission")
    
    donation_payload = {
        "name": "Pedro Ramírez",
        "amount": 250.0,
        "comment": "Excelente causa, espero que logren su meta.",
        "paymentMethod": "Zelle",
        "reference": "REF-TEST-12345"
    }
    
    try:
        # Get campaign current amount before donation
        campaign_before = requests.get(f"{BASE_URL}/campaigns/{campaign_id}", timeout=10).json()
        current_before = campaign_before.get("current", 0.0)
        
        response = requests.post(
            f"{BASE_URL}/campaigns/{campaign_id}/donations",
            json=donation_payload,
            timeout=10
        )
        passed = response.status_code == 200
        
        if passed:
            donation = response.json()
            # Verify donation fields
            checks = [
                donation.get("campaignId") == campaign_id,
                donation.get("name") == donation_payload["name"],
                donation.get("amount") == donation_payload["amount"],
                donation.get("paymentMethod") == donation_payload["paymentMethod"],
                "id" in donation,
                "date" in donation
            ]
            passed = all(checks)
            
            # Verify campaign amount was updated
            campaign_after = requests.get(f"{BASE_URL}/campaigns/{campaign_id}", timeout=10).json()
            current_after = campaign_after.get("current", 0.0)
            amount_updated = abs(current_after - current_before - donation_payload["amount"]) < 0.01
            
            if not amount_updated:
                passed = False
                details = f"Status: {response.status_code} | ERROR: Campaign amount not updated correctly"
            else:
                details = f"Status: {response.status_code}, Donation ID: {donation.get('id', 'N/A')}, Amount updated: ${current_before} → ${current_after}"
        else:
            details = f"Status: {response.status_code}, Response: {response.text[:200]}"
        
        print_test(f"POST /api/campaigns/{campaign_id}/donations", passed, details)
        record_test("Create donation", passed, critical=True)
        return passed
    except Exception as e:
        print_test(f"POST /api/campaigns/{campaign_id}/donations", False, f"Error: {str(e)}")
        record_test("Create donation", False, critical=True)
        return False

def test_admin_toggle_active(campaign_id: str):
    """Test PATCH /api/admin/campaigns/{id}/toggle-active"""
    print_section("5. Testing Admin Toggle Active")
    
    try:
        # Get current status
        campaign_before = requests.get(f"{BASE_URL}/campaigns/{campaign_id}", timeout=10).json()
        is_active_before = campaign_before.get("isActive", True)
        
        # Toggle
        response = requests.patch(f"{BASE_URL}/admin/campaigns/{campaign_id}/toggle-active", timeout=10)
        passed = response.status_code == 200
        
        if passed:
            campaign_after = response.json()
            is_active_after = campaign_after.get("isActive", True)
            toggled_correctly = is_active_after != is_active_before
            
            if not toggled_correctly:
                passed = False
                details = f"Status: {response.status_code} | ERROR: Status not toggled"
            else:
                details = f"Status: {response.status_code}, Toggled: {is_active_before} → {is_active_after}"
        else:
            details = f"Status: {response.status_code}"
        
        print_test(f"PATCH /api/admin/campaigns/{campaign_id}/toggle-active", passed, details)
        record_test("Admin toggle active", passed, critical=True)
        return passed
    except Exception as e:
        print_test(f"PATCH /api/admin/campaigns/{campaign_id}/toggle-active", False, f"Error: {str(e)}")
        record_test("Admin toggle active", False, critical=True)
        return False

def test_admin_toggle_stripe(campaign_id: str):
    """Test PATCH /api/admin/campaigns/{id}/toggle-stripe"""
    try:
        # Get current status
        campaign_before = requests.get(f"{BASE_URL}/campaigns/{campaign_id}", timeout=10).json()
        stripe_before = campaign_before.get("stripeEnabled", True)
        
        # Toggle
        response = requests.patch(f"{BASE_URL}/admin/campaigns/{campaign_id}/toggle-stripe", timeout=10)
        passed = response.status_code == 200
        
        if passed:
            campaign_after = response.json()
            stripe_after = campaign_after.get("stripeEnabled", True)
            toggled_correctly = stripe_after != stripe_before
            
            if not toggled_correctly:
                passed = False
                details = f"Status: {response.status_code} | ERROR: Stripe status not toggled"
            else:
                details = f"Status: {response.status_code}, Stripe toggled: {stripe_before} → {stripe_after}"
        else:
            details = f"Status: {response.status_code}"
        
        print_test(f"PATCH /api/admin/campaigns/{campaign_id}/toggle-stripe", passed, details)
        record_test("Admin toggle stripe", passed, critical=True)
        return passed
    except Exception as e:
        print_test(f"PATCH /api/admin/campaigns/{campaign_id}/toggle-stripe", False, f"Error: {str(e)}")
        record_test("Admin toggle stripe", False, critical=True)
        return False

def test_admin_approve_payment(campaign_id: str):
    """Test POST /api/admin/campaigns/{campaign_id}/approve-payment/{method_id}"""
    print_section("6. Testing Admin Payment Approval")
    
    try:
        # Get campaign with payment methods
        campaign = requests.get(f"{BASE_URL}/campaigns/{campaign_id}", timeout=10).json()
        payment_methods = campaign.get("customPaymentMethods", [])
        
        if not payment_methods:
            print_test("POST /api/admin/campaigns/{id}/approve-payment/{method_id}", False, 
                      "No payment methods found to test approval")
            record_test("Admin approve payment", False, critical=False)
            return False
        
        # Find an unapproved method or use the first one
        method_to_approve = None
        for method in payment_methods:
            if not method.get("approved", False):
                method_to_approve = method
                break
        
        if not method_to_approve:
            method_to_approve = payment_methods[0]
        
        method_id = method_to_approve["id"]
        
        # Approve the method
        response = requests.post(
            f"{BASE_URL}/admin/campaigns/{campaign_id}/approve-payment/{method_id}",
            json={"approved": True},
            timeout=10
        )
        passed = response.status_code == 200
        
        if passed:
            campaign_after = response.json()
            updated_methods = campaign_after.get("customPaymentMethods", [])
            approved_method = next((m for m in updated_methods if m["id"] == method_id), None)
            
            if approved_method and approved_method.get("approved") == True:
                details = f"Status: {response.status_code}, Method '{approved_method['name']}' approved successfully"
            else:
                passed = False
                details = f"Status: {response.status_code} | ERROR: Method not approved correctly"
        else:
            details = f"Status: {response.status_code}, Response: {response.text[:200]}"
        
        print_test(f"POST /api/admin/campaigns/{campaign_id}/approve-payment/{method_id}", passed, details)
        record_test("Admin approve payment", passed, critical=True)
        return passed
    except Exception as e:
        print_test(f"POST /api/admin/campaigns/{{id}}/approve-payment/{{method_id}}", False, f"Error: {str(e)}")
        record_test("Admin approve payment", False, critical=True)
        return False

def test_admin_stats():
    """Test GET /api/admin/stats"""
    print_section("7. Testing Admin Stats")
    
    try:
        response = requests.get(f"{BASE_URL}/admin/stats", timeout=10)
        passed = response.status_code == 200
        
        if passed:
            stats = response.json()
            required_fields = ["totalRaised", "activeCount", "pendingApprovalsCount", "donationsCount"]
            has_all_fields = all(field in stats for field in required_fields)
            
            if not has_all_fields:
                passed = False
                details = f"Status: {response.status_code} | ERROR: Missing required fields"
            else:
                details = f"Status: {response.status_code}, Stats: Total Raised: ${stats['totalRaised']}, Active: {stats['activeCount']}, Pending: {stats['pendingApprovalsCount']}, Donations: {stats['donationsCount']}"
        else:
            details = f"Status: {response.status_code}"
        
        print_test("GET /api/admin/stats", passed, details)
        record_test("Admin stats", passed, critical=True)
        return passed
    except Exception as e:
        print_test("GET /api/admin/stats", False, f"Error: {str(e)}")
        record_test("Admin stats", False, critical=True)
        return False

def test_admin_donations():
    """Test GET /api/admin/donations"""
    try:
        response = requests.get(f"{BASE_URL}/admin/donations", timeout=10)
        passed = response.status_code == 200
        
        if passed:
            donations = response.json()
            passed = isinstance(donations, list)
            details = f"Status: {response.status_code}, Found {len(donations)} donations"
        else:
            details = f"Status: {response.status_code}"
        
        print_test("GET /api/admin/donations", passed, details)
        record_test("Admin donations list", passed, critical=True)
        return passed
    except Exception as e:
        print_test("GET /api/admin/donations", False, f"Error: {str(e)}")
        record_test("Admin donations list", False, critical=True)
        return False

def test_campaign_filters():
    """Test GET /api/campaigns with filters"""
    print_section("8. Testing Campaign Filters")
    
    # Test category filter
    try:
        response = requests.get(f"{BASE_URL}/campaigns?category=Salud", timeout=10)
        passed = response.status_code == 200
        
        if passed:
            campaigns = response.json()
            all_match_category = all(c.get("category") == "Salud" for c in campaigns)
            if not all_match_category and len(campaigns) > 0:
                passed = False
                details = f"Status: {response.status_code} | ERROR: Found campaigns not matching category filter"
            else:
                details = f"Status: {response.status_code}, Found {len(campaigns)} campaigns in 'Salud' category"
        else:
            details = f"Status: {response.status_code}"
        
        print_test("GET /api/campaigns?category=Salud", passed, details)
        record_test("Campaign category filter", passed, critical=False)
    except Exception as e:
        print_test("GET /api/campaigns?category=Salud", False, f"Error: {str(e)}")
        record_test("Campaign category filter", False, critical=False)
    
    # Test search filter
    try:
        response = requests.get(f"{BASE_URL}/campaigns?search=Sofía", timeout=10)
        passed = response.status_code == 200
        
        if passed:
            campaigns = response.json()
            details = f"Status: {response.status_code}, Found {len(campaigns)} campaigns matching 'Sofía'"
        else:
            details = f"Status: {response.status_code}"
        
        print_test("GET /api/campaigns?search=Sofía", passed, details)
        record_test("Campaign search filter", passed, critical=False)
    except Exception as e:
        print_test("GET /api/campaigns?search=Sofía", False, f"Error: {str(e)}")
        record_test("Campaign search filter", False, critical=False)

# ============= MAIN TEST RUNNER =============

def main():
    print(f"\n{Colors.YELLOW}{'='*60}{Colors.RESET}")
    print(f"{Colors.YELLOW}Backend API Testing - donafacil.app{Colors.RESET}")
    print(f"{Colors.YELLOW}Base URL: {BASE_URL}{Colors.RESET}")
    print(f"{Colors.YELLOW}{'='*60}{Colors.RESET}")
    
    # 1. Test root endpoint
    if not test_root_endpoint():
        print(f"\n{Colors.RED}CRITICAL: Root endpoint failed. Backend may not be running.{Colors.RESET}")
        print_summary()
        sys.exit(1)
    
    # 2. Test get campaigns
    campaigns = test_get_campaigns()
    if not campaigns:
        print(f"\n{Colors.RED}CRITICAL: Cannot retrieve campaigns. Stopping tests.{Colors.RESET}")
        print_summary()
        sys.exit(1)
    
    # Use first campaign for testing
    test_campaign_id = campaigns[0]["id"]
    
    # 3. Test get campaign by ID
    test_get_campaign_by_id(test_campaign_id)
    
    # 4. Test create campaign (with 3 photos limit)
    created_campaign_id = test_create_campaign()
    
    # 5. Test donation submission
    if created_campaign_id:
        test_create_donation(created_campaign_id)
    else:
        print(f"{Colors.YELLOW}Skipping donation test (no campaign created){Colors.RESET}")
    
    # 6. Test admin toggles
    test_admin_toggle_active(test_campaign_id)
    test_admin_toggle_stripe(test_campaign_id)
    
    # 7. Test admin payment approval
    if created_campaign_id:
        test_admin_approve_payment(created_campaign_id)
    else:
        test_admin_approve_payment(test_campaign_id)
    
    # 8. Test admin stats and donations
    test_admin_stats()
    test_admin_donations()
    
    # 9. Test filters
    test_campaign_filters()
    
    # Print summary
    print_summary()
    
    # Exit with appropriate code
    if test_results["failed"] > 0:
        sys.exit(1)
    else:
        sys.exit(0)

def print_summary():
    print(f"\n{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BLUE}TEST SUMMARY{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"Total Tests: {test_results['total']}")
    print(f"{Colors.GREEN}Passed: {test_results['passed']}{Colors.RESET}")
    print(f"{Colors.RED}Failed: {test_results['failed']}{Colors.RESET}")
    
    if test_results["critical_failures"]:
        print(f"\n{Colors.RED}Critical Failures:{Colors.RESET}")
        for failure in test_results["critical_failures"]:
            print(f"  - {failure}")
    
    if test_results["failed"] == 0:
        print(f"\n{Colors.GREEN}✓ All tests passed!{Colors.RESET}\n")
    else:
        print(f"\n{Colors.RED}✗ Some tests failed. Please review the output above.{Colors.RESET}\n")

if __name__ == "__main__":
    main()
