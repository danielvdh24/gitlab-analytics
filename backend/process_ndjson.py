import pandas as pd
import json
from datetime import datetime
from pathlib import Path

def load_ndjson(path):
    with open(path, 'r', encoding='utf-8') as f:
        return pd.DataFrame([json.loads(line) for line in f])

def format_date(date_str):
    try:
        return datetime.strptime(date_str[:10], "%Y-%m-%d").strftime("%B %d, %Y")
    except:
        return None

def process_gitlab_export(extracted_path: Path, output_path: Path):
    print(f"Extracted to: {extracted_path}")

    # Find correct subfolder containing 'tree/project'
    tree_path = None
    for subdir in extracted_path.rglob("tree/project"):
        tree_path = subdir
        break

    if not tree_path:
        raise FileNotFoundError("Could not locate 'tree/project' folder in extracted archive.")

    print(f"Looking for NDJSON files in: {tree_path}")

    issues_file = tree_path / "issues.ndjson"
    mr_file = tree_path / "merge_requests.ndjson"
    members_file = tree_path / "project_members.ndjson"

    # Check existence
    for file in [issues_file, mr_file, members_file]:
        if not file.exists():
            raise FileNotFoundError(f"Required file not found: {file}")

    print("All required NDJSON files found.")

    issues_df = load_ndjson(issues_file)
    mr_df = load_ndjson(mr_file)
    members_df = load_ndjson(members_file)

    print(f"Loaded: {len(issues_df)} issues, {len(mr_df)} merge requests, {len(members_df)} members")

    id_to_username = {
        row['user_id']: row['user']['username']
        for _, row in members_df.iterrows()
        if 'user' in row and 'username' in row['user']
    }

    def extract_notes_from(df, type_name):
        rows = []
        for _, row in df.iterrows():
            try:
                notes = json.loads(row['notes']) if isinstance(row['notes'], str) else row['notes']
            except Exception:
                notes = []
            if isinstance(notes, list):
                for note in notes:
                    if isinstance(note, dict):
                        rows.append({
                            'type': type_name,
                            'title': row.get('title', ''),
                            'created': format_date(note.get('created_at')),
                            'author_username': id_to_username.get(note.get('author_id'), 'Unknown'),
                            'comment': note.get('note', '')
                        })
        return rows

    comments_df = pd.DataFrame(
        extract_notes_from(issues_df, 'Issue') + extract_notes_from(mr_df, 'Merge Request')
    )

    drop_issues_cols = [
        'award_emoji', 'confidential', 'designs', 'design_versions', 'discussion_locked', 'due_date',
        'events', 'external_key', 'health_status', 'zoom_meetings', 'work_item_type', 'lock_version',
        'time_estimate', 'relative_position', 'weight', 'timelogs', 'project_id', 'label_links',
        'resource_label_events', 'resource_state_events', 'resource_milestone_events', 'last_edited_at',
        'iid', 'author_id'
    ]
    issues_df.drop(columns=[col for col in drop_issues_cols if col in issues_df.columns], inplace=True)

    drop_mr_cols = [
        'resource_milestone_events', 'resource_state_events', 'resource_label_events', 'label_links',
        'target_project_id', 'updated_by_id', 'merge_error', 'merge_params', 'merge_user_id',
        'merge_commit_sha', 'in_progress_merge_commit_sha', 'lock_version', 'time_estimate',
        'last_edited_at', 'last_edited_by_id', 'discussion_locked', 'rebase_commit_sha', 'squash',
        'allow_maintainer_to_push', 'squash_commit_sha', 'merge_ref_sha', 'draft', 'diff_head_sha',
        'source_branch_sha', 'target_branch_sha', 'approvals_before_merge', 'metrics', 'award_emoji',
        'timelogs', 'source_project_id', 'merge_request_diff', 'author_id'
    ]
    mr_df.drop(columns=[col for col in drop_mr_cols if col in mr_df.columns], inplace=True)

    issues_df['author_username'] = issues_df['author_id'].map(id_to_username)

    by_id_mappings = [
        ('updated_by_id', 'updated_by_username'),
        ('last_edited_by_id', 'last_edited_username'),
        ('closed_by_id', 'closed_by_username')
    ]
    for old_col, new_col in by_id_mappings:
        if old_col in issues_df.columns:
            issues_df[new_col] = issues_df[old_col].apply(lambda x: id_to_username.get(int(x), 'Unknown') if pd.notna(x) else None)
            issues_df.drop(columns=[old_col], inplace=True)

    issues_df['assigned_username'] = issues_df['issue_assignees'].apply(
        lambda assignees: id_to_username.get(assignees[0]['user_id'], 'Unknown') if isinstance(assignees, list) and assignees else None
    )
    issues_df.drop(columns=['issue_assignees'], inplace=True, errors='ignore')

    cols = list(issues_df.columns)
    reorder_cols = ['author_username', 'assigned_username'] + [new for _, new in by_id_mappings]
    for col in reorder_cols:
        if col in cols:
            cols.insert(1 if col == 'author_username' else 2, cols.pop(cols.index(col)))
    issues_df = issues_df[cols]

    for col in ['created_at', 'updated_at', 'last_edited_at', 'closed_at']:
        if col in issues_df.columns:
            issues_df[col] = issues_df[col].apply(format_date)

    def format_milestone(m):
        if isinstance(m, dict):
            parts = []
            if m.get('title'): parts.append(f"Title: {m['title']}")
            if m.get('description'): parts.append(f"Description: {m['description']}")
            if m.get('start_date'): parts.append(f"Start: {format_date(m['start_date'])}")
            if m.get('due_date'): parts.append(f"Due: {format_date(m['due_date'])}")
            return " | ".join(parts)
        return None
    if 'milestone' in issues_df.columns:
        issues_df['milestone'] = issues_df['milestone'].apply(format_milestone)

    def extract_note_text(notes):
        if isinstance(notes, list):
            return "\n---\n".join(
                [f"{n.get('note', '').strip()}\n(by {n.get('author', {}).get('name', 'Unknown')} on {format_date(n.get('created_at', '') or '')})"
                 for n in notes if isinstance(n, dict)]
            )
        return None
    issues_df['notes'] = issues_df['notes'].apply(extract_note_text)

    mr_df['author_username'] = mr_df['author_id'].map(id_to_username)
    for col in ['created_at', 'updated_at']:
        if col in mr_df.columns:
            mr_df[col] = mr_df[col].apply(format_date)

    if 'approvals' in mr_df.columns:
        def format_approvals(ap):
            if isinstance(ap, list):
                return "; ".join([f"{id_to_username.get(i.get('user_id'), 'Unknown')} on {format_date(i.get('created_at'))}" for i in ap if isinstance(i, dict)])
            return None
        mr_df['approvals'] = mr_df['approvals'].apply(format_approvals)

    for field, new_name in [('merge_request_assignees', 'assignees'), ('merge_request_reviewers', 'reviewers')]:
        if field in mr_df.columns:
            def extract_users(entries):
                return "; ".join([
                    f"{id_to_username.get(e['user_id'], 'Unknown')} on {format_date(e.get('created_at'))}" for e in entries if isinstance(e, dict)
                ]) if isinstance(entries, list) else None
            mr_df[new_name] = mr_df[field].apply(extract_users)
            mr_df.drop(columns=[field], inplace=True)

    mr_cols = list(mr_df.columns)
    author_idx = mr_cols.index('author_id') if 'author_id' in mr_cols else 1
    for col in ['author_username', 'assignees', 'reviewers']:
        if col in mr_cols:
            mr_cols.insert(author_idx + 1, mr_cols.pop(mr_cols.index(col)))
            author_idx += 1
    mr_df = mr_df[mr_cols]

    if 'notes' in mr_df.columns:
        mr_df['notes'] = mr_df['notes'].apply(extract_note_text)

    if 'milestone' in mr_df.columns:
        mr_df['milestone'] = mr_df['milestone'].apply(format_milestone)

    if 'events' in mr_df.columns:
        def format_events(events):
            if isinstance(events, list):
                return "; ".join([
                    f"{id_to_username.get(e.get('author_id'), 'Unknown')} {e.get('action')} on {format_date(e.get('created_at'))}"
                    for e in events if isinstance(e, dict)
                ])
            return None
        mr_df['events'] = mr_df['events'].apply(format_events)

    output_path.mkdir(parents=True, exist_ok=True)
    issues_df.to_csv(output_path / "cleaned_issues.csv", index=False)
    mr_df.to_csv(output_path / "cleaned_merge_requests.csv", index=False)
    comments_df.to_csv(output_path / "all_comments.csv", index=False)

    print("CSV files exported.")
    return {
        "issues": str(output_path / "cleaned_issues.csv"),
        "merge_requests": str(output_path / "cleaned_merge_requests.csv"),
        "comments": str(output_path / "all_comments.csv")
    }
