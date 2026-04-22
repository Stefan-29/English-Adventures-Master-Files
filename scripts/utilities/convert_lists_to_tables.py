#!/usr/bin/env python3
"""
Convert <ul><li> lists to <table> structures in JSON lesson files.
Processes all lesson JSON files and converts lists to professional HTML tables.
"""

import json
import re
import os
import sys
from pathlib import Path

def convert_list_to_table(list_html, color_class):
    """Convert a <ul><li>...</li>...</ul> to a table with headers and data."""
    # Extract list items
    list_items = re.findall(r'<li>(.*?)</li>', list_html, re.DOTALL)
    
    if not list_items:
        return list_html
    
    # Parse items to identify headers and content
    rows = []
    for item in list_items:
        item = item.strip()
        # Check if there's a <strong> element at the start followed by colon
        strong_match = re.match(r'^<strong>(.*?)</strong>:\s*(.*?)$', item, re.DOTALL)
        if strong_match:
            label = strong_match.group(1)
            content = strong_match.group(2)
            rows.append({'label': label, 'content': content})
        else:
            rows.append({'label': None, 'content': item})
    
    if not rows:
        return list_html
    
    # Build the table
    has_labels = any(r['label'] for r in rows)
    table_html = f'<table class="lesson-table {color_class}">'
    
    if has_labels:
        # Two-column table: Label | Content
        table_html += '<tr><th>Category</th><th>Details</th></tr>'
        for row in rows:
            label = row['label'] or ''
            content = row['content'].strip()
            table_html += f'<tr><td>{label}</td><td>{content}</td></tr>'
    else:
        # Single-column table
        table_html += '<tr><th>Information</th></tr>'
        for row in rows:
            content = row['content'].strip()
            table_html += f'<tr><td>{content}</td></tr>'
    
    table_html += '</table>'
    return table_html

def process_file(filepath, color_class='table-blue'):
    """Process a single JSON file and convert lists to tables."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        modified = False
        
        # Process lesson activities
        if 'lessonActivities' in data:
            for lesson in data['lessonActivities']:
                if 'content' in lesson:
                    # Find all <ul>...</ul> blocks and convert them
                    original_content = lesson['content']
                    lesson['content'] = re.sub(
                        r'<ul>(.*?)</ul>',
                        lambda m: convert_list_to_table(m.group(0), color_class),
                        lesson['content'],
                        flags=re.DOTALL
                    )
                    if lesson['content'] != original_content:
                        modified = True
        
        if modified:
            # Write back to file
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=4)
            return True
        return False
    except Exception as e:
        print(f"Error processing {filepath}: {e}", file=sys.stderr)
        return False

def get_color_for_file(filename):
    """Determine the appropriate color class for a file."""
    # Map files to colors based on content type
    color_map = {
        'a-an-the.json': 'table-blue',
        'a-lot-of-much-many.json': 'table-green',
        'can-could-be-able-to.json': 'table-purple',
        'causative-verbs.json': 'table-orange',
        'conditional-structures.json': 'table-yellow',
        'countable-vs-uncountable-nouns.json': 'table-gray',
        'each-every.json': 'table-teal',
        'each-other-one-another-ourselves.json': 'table-pink',
        'everyone-vs-every-one.json': 'table-blue',
        'few-little.json': 'table-green',
        'future-perfect.json': 'table-orange',
        'if-alternatives.json': 'table-yellow',
        'may-might.json': 'table-purple',
        'must-have-to-have-got-to.json': 'table-teal',
        'other-another.json': 'table-blue',
        'past-perfect.json': 'table-orange',
        'present-simple-continuous.json': 'table-green',
        'shall-will-would-had-better.json': 'table-yellow',
        'should-ought-to.json': 'table-purple',
        'some-any-a-little-a-few.json': 'table-gray',
        'subjunctive-mood.json': 'table-pink',
        'this-that-these-those.json': 'table-blue',
        'wish-if-if-only.json': 'table-purple',
    }
    return color_map.get(filename, 'table-blue')

if __name__ == '__main__':
    # Define the directory and files
    repo_dir = '/workspaces/English-Adventures-Master-Files/reproducibility'
    target_files = [
        'a-an-the.json', 'a-lot-of-much-many.json', 'can-could-be-able-to.json',
        'causative-verbs.json', 'conditional-structures.json', 'countable-vs-uncountable-nouns.json',
        'each-every.json', 'each-other-one-another-ourselves.json', 'everyone-vs-every-one.json',
        'few-little.json', 'future-perfect.json', 'if-alternatives.json', 'may-might.json',
        'must-have-to-have-got-to.json', 'other-another.json', 'past-perfect.json',
        'present-simple-continuous.json', 'shall-will-would-had-better.json',
        'should-ought-to.json', 'some-any-a-little-a-few.json', 'subjunctive-mood.json',
        'this-that-these-those.json', 'wish-if-if-only.json'
    ]
    
    processed = []
    failed = []
    
    for filename in target_files:
        filepath = os.path.join(repo_dir, filename)
        color = get_color_for_file(filename)
        
        if os.path.exists(filepath):
            if process_file(filepath, color):
                processed.append(filename)
            else:
                failed.append(filename)
        else:
            failed.append(f"{filename} (not found)")
    
    print(f"Processed {len(processed)} files")
    print(f"Failed {len(failed)} files")
    if processed:
        print("\nProcessed files:")
        for f in processed:
            print(f"  ✓ {f}")
    if failed:
        print("\nFailed files:")
        for f in failed:
            print(f"  ✗ {f}")
