# PDF Field Mapping - Quick Test Guide

## ✅ What's Been Configured

1. **Route Added**: `/admin/pages/pdf-field-mapping`
2. **Menu Link Added**: "Pages" → "PDF Field Mapping" (visible to all authenticated users)
3. **Full API Integration**: All CRUD operations wired up

## 🚀 How to Test

### Step 1: Start the Frontend
```powershell
cd C:\Projects\Funeral\Frontend
npm start
# or
ng serve
```

### Step 2: Navigate to the Page
1. Login to your application
2. Go to sidebar menu → "Pages" section
3. Click "PDF Field Mapping"
4. URL should be: `http://localhost:4200/admin/pages/pdf-field-mapping`

### Step 3: Test Basic Functionality

#### Create a Simple Mapping
1. Click **"Create Mapping"** button
2. Fill in:
   - **Source Field**: Select `FirstNames` from dropdown
   - **PDF Field Name**: Type `firstName`
   - **Mapping Type**: Keep as `Simple (Direct mapping)`
   - **Category**: Select `Personal Information`
   - **Description**: Type "Maps first names to PDF first name field"
3. Click **Save**
4. ✅ You should see it in the table with an enabled toggle

#### Test Quick Template: Title → Checkboxes
1. Click **"Title → Checkboxes"** button (in Quick Setup Templates section)
2. The dialog opens pre-populated with:
   - Source Field: `Title`
   - Mapping Type: `Conditional`
   - 6 conditional rules for Mr, Mrs, Ms, Miss, Dr, Prof
3. **Important**: Edit the PDF field names to match your actual PDF:
   - Change `checkbox_Mr` to whatever your PDF field is actually named
   - Do this for each rule
4. Click **Save**
5. ✅ You should see the conditional mapping in the table

#### Test Edit
1. Click the **edit icon** (pencil) on any mapping
2. Change the description
3. Click **Save**
4. ✅ Changes should appear immediately

#### Test Enable/Disable Toggle
1. Click the **toggle switch** on any mapping
2. ✅ Toast notification: "Mapping enabled/disabled successfully"
3. Toggle it back
4. ✅ Another success message

#### Test Delete
1. Click the **delete icon** (trash) on a mapping
2. Confirm the dialog
3. ✅ Mapping removed from table with success message

### Step 4: Test Template Analyzer (Optional)

**Note**: This requires a PDF template to be uploaded first.

#### If you have a PDF template uploaded:
1. Get the template file ID from database:
   ```sql
   SELECT Id, FileName FROM FileUpload 
   WHERE TenantId = '<your-tenant-id>' 
   AND FileType LIKE '%pdf%' 
   ORDER BY CreatedAt DESC;
   ```

2. In the component, modify `loadCurrentTemplate()` method temporarily:
   ```typescript
   loadCurrentTemplate(): void {
     const templateId = 'paste-your-template-id-here';
     this.analyzeTemplate(templateId);
   }
   ```

3. Click **"Analyze Template"** button
4. ✅ Dialog shows all PDF form fields with types
5. Click **"Create Mapping"** quick action next to any field
6. ✅ Dialog opens with PDF field name pre-filled

#### If you don't have a PDF template:
- Skip this step for now
- The analyzer will be useful later when you have PDF templates with form fields

### Step 5: Verify Backend Integration

Check the browser DevTools Network tab:
1. **Create mapping**: Should see `POST /api/PdfFieldMapping/PdfFieldMapping_Create`
2. **Load mappings**: Should see `GET /api/PdfFieldMapping/PdfFieldMapping_GetAll`
3. **Update mapping**: Should see `PUT /api/PdfFieldMapping/PdfFieldMapping_Update/{id}`
4. **Delete mapping**: Should see `DELETE /api/PdfFieldMapping/PdfFieldMapping_Delete/{id}`

All should return **200 OK** with proper JSON responses.

### Step 6: Test End-to-End Flow

1. **Create a member** with Title = "Mrs"
2. **Generate a contract** for that member
3. **Check the generated PDF**:
   - If you created the Title → Checkboxes conditional mapping
   - And configured the PDF field names correctly
   - The "Mrs" checkbox should be ticked automatically ✅

## 📊 Statistics Dashboard

The top of the page shows 4 cards:
- **Total Mappings**: Count of all mappings
- **Enabled**: Count of active mappings
- **Conditional**: Count of conditional mappings
- **Simple**: Count of simple mappings

These update in real-time as you add/edit/delete mappings.

## 🎯 Example Mappings to Create

### For Testing Different Types:

1. **Simple Mapping**:
   - Source: `Surname` → PDF: `surname`

2. **Conditional Mapping**:
   - Source: `Gender` → Rules:
     - `value == 'Male'` → `checkbox_Male` = `Yes`
     - `value == 'Female'` → `checkbox_Female` = `Yes`

3. **Transform Mapping**:
   - Source: `DateOfBirth` → PDF: `dob`
   - Transform: `Format Date (dd/MM/yyyy)`

4. **Checkbox Mapping**:
   - Source: `IsForeigner` → PDF: `foreignNational`
   - Checked Value: `Yes`
   - Unchecked Value: `Off`

## ✅ Success Criteria

Your system is working if:
- ✅ Menu link appears in sidebar
- ✅ Page loads without errors
- ✅ Can create mappings (see success toast)
- ✅ Mappings appear in table immediately
- ✅ Can edit mappings (changes persist)
- ✅ Can toggle enable/disable (API call works)
- ✅ Can delete mappings (removed from table)
- ✅ Statistics cards update correctly
- ✅ Browser console has no errors
- ✅ Network tab shows successful API calls

## 🐛 Troubleshooting

### "Page not found"
- Check frontend is running: `npm start`
- Check you're logged in
- Verify URL: `http://localhost:4200/admin/pages/pdf-field-mapping`

### "API call fails"
- Check backend is running
- Check browser console for CORS errors
- Verify API base URL in environment files

### "No mappings showing"
- Create a new mapping first
- Check Network tab for API response
- Check browser console for errors

### "Toast messages not appearing"
- Check if MessageService is properly injected
- Check browser console for PrimeNG errors

## 🎉 Next Steps

Once basic testing is complete:
1. Upload a real PDF template with form fields
2. Use the Template Analyzer to see all field names
3. Create mappings for your actual onboarding data
4. Test contract generation with real member data
5. Verify PDF fields are filled correctly

Your PDF Field Mapping system is ready to use! 🚀
