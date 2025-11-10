# Quick Testing URLs - Emtelaak Offerings

## 🚀 Direct Access Links

### Main Pages
- **Home**: https://3000-ijq7ixk5t4c3s9v9ubp5w-b6a5c71b.manus.computer
- **Offerings Dashboard**: https://3000-ijq7ixk5t4c3s9v9ubp5w-b6a5c71b.manus.computer/offerings
- **Create New Offering**: https://3000-ijq7ixk5t4c3s9v9ubp5w-b6a5c71b.manus.computer/offerings/create
- **Admin Approvals**: https://3000-ijq7ixk5t4c3s9v9ubp5w-b6a5c71b.manus.computer/admin/offering-approvals

---

## 📋 Existing Offerings (Test Data)

### Offering #1 - Under Review
- **URL**: https://3000-ijq7ixk5t4c3s9v9ubp5w-b6a5c71b.manus.computer/offerings/1
- **Status**: under_review
- **Amount**: $5,000,000
- **Property ID**: 1

### Offering #2 - Under Review
- **URL**: https://3000-ijq7ixk5t4c3s9v9ubp5w-b6a5c71b.manus.computer/offerings/2
- **Status**: under_review
- **Amount**: $5,000,000
- **Property ID**: 1

### Offering #3 - Under Review
- **URL**: https://3000-ijq7ixk5t4c3s9v9ubp5w-b6a5c71b.manus.computer/offerings/3
- **Status**: under_review
- **Amount**: $5,000,000
- **Property ID**: 1

### Offering #4 - Approved ✅
- **URL**: https://3000-ijq7ixk5t4c3s9v9ubp5w-b6a5c71b.manus.computer/offerings/4
- **Status**: approved
- **Amount**: $10,000,000
- **Property ID**: 1

### Offering #5 - Draft
- **URL**: https://3000-ijq7ixk5t4c3s9v9ubp5w-b6a5c71b.manus.computer/offerings/5
- **Status**: draft
- **Amount**: $2,500,000
- **Property ID**: 1

### Offering #30001 - Under Review
- **URL**: https://3000-ijq7ixk5t4c3s9v9ubp5w-b6a5c71b.manus.computer/offerings/30001
- **Status**: under_review
- **Amount**: $1,000,000
- **Property ID**: 4

---

## 🏢 Available Properties (for Creating Offerings)

### Property #1 - Available
- **Status**: available
- **Can be used for new offerings**

### Property #2 - Available
- **Status**: available
- **Can be used for new offerings**

### Property #3 - Available
- **Status**: available
- **Can be used for new offerings**

### Property #4 - Available
- **Status**: available
- **Can be used for new offerings**

### Property #5 - Available
- **Status**: available
- **Can be used for new offerings**

### Property #30002 - Available
- **Status**: available
- **Can be used for new offerings**

### Property #30001 - Coming Soon
- **Status**: coming_soon
- **Not available for new offerings yet**

---

## ✅ Testing Workflow

### 1. View Existing Offerings
Start here: https://3000-ijq7ixk5t4c3s9v9ubp5w-b6a5c71b.manus.computer/offerings

### 2. View an Offering Detail
Try this approved offering: https://3000-ijq7ixk5t4c3s9v9ubp5w-b6a5c71b.manus.computer/offerings/4

### 3. Create New Offering
Go here: https://3000-ijq7ixk5t4c3s9v9ubp5w-b6a5c71b.manus.computer/offerings/create

**Now the property dropdown should show 6 available properties!**

### 4. Admin Review
Go here: https://3000-ijq7ixk5t4c3s9v9ubp5w-b6a5c71b.manus.computer/admin/offering-approvals

---

## 🔧 What Was Fixed

**Problem**: Property dropdown was empty because the code was looking for `titleEn` and `titleAr` columns, but the database uses `name` and `nameAr`.

**Solution**: Updated `CreateOffering.tsx` to use the correct column names:
```typescript
{property.name || property.nameAr || `Property #${property.id}`}
```

**Result**: The dropdown now displays all 6 available properties!

---

## 📝 Next Steps

1. **Refresh the create offering page** (Ctrl+R or Cmd+R)
2. **Click the Property dropdown** - you should now see 6 properties
3. **Select a property** and continue with the offering creation wizard
4. **Complete all 5 steps** to create your test offering
5. **Submit for review** to test the approval workflow

---

## 💡 Tips

- The property dropdown only shows properties with `status = "available"`
- Properties with `status = "coming_soon"` won't appear in the dropdown
- If you don't see properties, check the browser console (F12) for errors
- The server may take a few seconds to respond on first load

---

**Last Updated**: Nov 20, 2025
