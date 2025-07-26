#!/usr/bin/env python3
"""
Focused test for PDF and DOCX export functionality
Tests the specific fixes mentioned in the review request
"""

import sys
import os
sys.path.append('/app')

from backend_test import BookWriterAPITester

def main():
    print("🚀 Starting PDF and DOCX Export Functionality Testing...")
    print("Focus: Verify chapter content (not just titles) appears in exports")
    print("=" * 80)
    
    tester = BookWriterAPITester()
    
    # Run the specific PDF/DOCX export test
    success = tester.test_pdf_docx_export_fixes()
    
    if success:
        print("\n" + "=" * 80)
        print("🎉 PDF AND DOCX EXPORT FIXES VERIFICATION SUCCESSFUL!")
        print("✅ Chapter content (not just titles) appears in both PDF and DOCX exports")
        print("✅ Asterisk formatting properly converted to bold")
        print("✅ Chapter titles appear only once (not duplicated)")
        print("✅ Watermarks appear in appropriate locations")
        print("=" * 80)
        return 0
    else:
        print("\n" + "=" * 80)
        print("❌ PDF AND DOCX EXPORT FIXES VERIFICATION FAILED!")
        print("❌ Some issues were found with the export functionality")
        print("=" * 80)
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)