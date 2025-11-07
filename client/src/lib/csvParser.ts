export interface ParsedUser {
  openId: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: "user" | "admin" | "super_admin";
}

export interface CSVParseResult {
  users: ParsedUser[];
  errors: string[];
}

export function parseCSV(csvText: string): CSVParseResult {
  const lines = csvText.trim().split('\n');
  const users: ParsedUser[] = [];
  const errors: string[] = [];

  if (lines.length === 0) {
    errors.push("CSV file is empty");
    return { users, errors };
  }

  // Parse header
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const requiredFields = ['openid'];
  const missingFields = requiredFields.filter(f => !header.includes(f));
  
  if (missingFields.length > 0) {
    errors.push(`Missing required columns: ${missingFields.join(', ')}`);
    return { users, errors };
  }

  // Get column indices
  const openIdIndex = header.indexOf('openid');
  const nameIndex = header.indexOf('name');
  const emailIndex = header.indexOf('email');
  const phoneIndex = header.indexOf('phone');
  const roleIndex = header.indexOf('role');

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = line.split(',').map(v => v.trim());
    
    // Validate openId
    const openId = values[openIdIndex];
    if (!openId) {
      errors.push(`Row ${i + 1}: Missing openId`);
      continue;
    }

    const user: ParsedUser = {
      openId,
    };

    // Add optional fields
    if (nameIndex >= 0 && values[nameIndex]) {
      user.name = values[nameIndex];
    }

    if (emailIndex >= 0 && values[emailIndex]) {
      const email = values[emailIndex];
      // Basic email validation
      if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        errors.push(`Row ${i + 1}: Invalid email format: ${email}`);
        continue;
      }
      user.email = email;
    }

    if (phoneIndex >= 0 && values[phoneIndex]) {
      user.phone = values[phoneIndex];
    }

    if (roleIndex >= 0 && values[roleIndex]) {
      const role = values[roleIndex].toLowerCase();
      if (role === 'user' || role === 'admin' || role === 'super_admin') {
        user.role = role as "user" | "admin" | "super_admin";
      } else {
        errors.push(`Row ${i + 1}: Invalid role: ${values[roleIndex]}. Must be user, admin, or super_admin`);
        continue;
      }
    }

    users.push(user);
  }

  return { users, errors };
}

export function generateCSVTemplate(): string {
  return `openId,name,email,phone,role
user123,John Doe,john@example.com,+1234567890,user
user456,Jane Smith,jane@example.com,+0987654321,admin`;
}

export function downloadCSVTemplate() {
  const template = generateCSVTemplate();
  const blob = new Blob([template], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'user_import_template.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
