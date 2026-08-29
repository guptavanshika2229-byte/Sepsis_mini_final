#!/usr/bin/env python
"""
Backend Demo & Presentation Rehearsal Summary Tool
Sepsis & Patient Deterioration Multimodal Early Warning System

Usage:
  py -3.11 backend_demo_summary.py
"""

import os
import json
import sys

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
METRICS_PATH = os.path.join(BASE_DIR, 'backend', 'models', 'saved', 'metrics_summary.json')

def print_banner():
    print("=" * 80)
    print("      SEPSIS & PATIENT DETERIORATION EARLY WARNING SYSTEM -- DEMO SUMMARY")
    print("=" * 80)

def load_or_compute_metrics():
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH, 'r') as f:
            return json.load(f)
    else:
        print("Metrics summary JSON not found. Computing now...")
        from backend.models.evaluate_phase8_metrics import compute_all_metrics
        return compute_all_metrics()

def display_summary():
    data = load_or_compute_metrics()
    print_banner()

    print("\n[+] HEADLINE METRIC (JUDGE PRESENTATION HIGHLIGHT)")
    print("-" * 80)
    hm = data["headline_metric"]
    print(f"  * EARLY WARNING GAINED:      {hm['early_warning_hours_gained']} HOURS")
    print(f"  * Lead Time vs. NEWS2 Score:  {hm['hours_gained_vs_news2']} hours earlier warning")
    print(f"  * Lead Time vs. SOFA Score:   {hm['hours_gained_vs_sofa']} hours earlier warning")
    print(f"  * Deterioration Events Evaluated: {hm['deterioration_events_analyzed']} ICU events")
    print(f"  * Summary: {hm['description']}")

    print("\n[+] MODEL EVALUATION LEADERBOARD")
    print("-" * 80)
    header = f"{'Rank':<6}{'Model Architecture':<42}{'AUROC':<10}{'AUPRC':<10}{'Cal.Slope':<10}"
    print(header)
    print("-" * 80)

    for item in data["model_leaderboard"]:
        row = f"{item['rank']:<6}{item['model_name']:<42}{item['auroc']:<10.4f}{item['auprc']:<10.4f}{item['calibration_slope']:<10.4f}"
        if item['rank'] == 1:
            row += "  <-- WINNING MODEL"
        print(row)

    print("\n[+] HERO DEMO PATIENTS CHEAT SHEET FOR LIVE DEMO")
    print("-" * 80)
    for hero in data["hero_demo_patients"]:
        print(f"  * [{hero['patient_id']}] {hero['label']}")
        print(f"    - Key Finding: {hero['key_finding']}")
        print(f"    - Demo Target: {hero['demo_focus']}\n")

    print("[+] ACTIVE API CONTRACT CHEAT SHEET (FASTAPI PORT 8000)")
    print("-" * 80)
    print("  * GET  /health                           -> System Health Check")
    print("  * GET  /patients?risk_level=high         -> Dashboard Patient List View")
    print("  * GET  /patients/P001/timeline           -> Interactive Timeline & Trajectory")
    print("  * GET  /patients/P001/explanation        -> Top SHAP/Gradient Factor Attribution")
    print("  * POST /patients/P001/counterfactual     -> Live What-If Intervention Simulation")
    print("  * POST /chat                             -> Grounded Clinical Chatbot Q&A")
    print("=" * 80 + "\n")

if __name__ == '__main__':
    display_summary()
