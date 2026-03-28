# Paras Cloth Store Online - Setup Guide

Follow these steps to deploy your cloth store website. Everything is FREE.

---

## Step 1: Create Free Accounts

You need 4 free accounts:

### 1.1 GitHub Account
- Go to https://github.com and sign up
- Push this project code to a new GitHub repository

### 1.2 Supabase Account (Database)
- Go to https://supabase.com and sign up with GitHub
- Click "New Project"
- Choose a name (e.g., "paras-cloth-store")
- Set a database password (save it!)
- Choose region: Mumbai (closest to India)
- Wait for project to be created

### 1.3 Cloudinary Account (Image Storage)
- Go to https://cloudinary.com and sign up
- After signup, go to Dashboard and note your **Cloud Name**
- Go to Settings > Upload > Upload Presets
- Click "Add Upload Preset"
- Set Signing Mode to "Unsigned"
- Name it: `paras_cloth_store`
- Save

### 1.4 Gmail App Password (for OTP emails)
- Go to https://myaccount.google.com/apppasswords
- You need 2-Step Verification enabled first
- Select "Mail" and your device
- Click "Generate"
- Copy the 16-character password (save it!)

---

## Step 2: Set Up Supabase Database

1. In your Supabase project, go to **SQL Editor**
2. Open the file `supabase-schema.sql` from this project
3. Copy the entire SQL content
4. Paste it into the SQL Editor
5. Click **Run** - this creates all tables

### Get Your Supabase Keys
- Go to **Settings > API** in Supabase
- Copy these values:
  - **Project URL** (looks like `https://xxxxx.supabase.co`)
  - **anon public key** (long string starting with `eyJ...`)
  - **service_role key** (another long string - keep this SECRET!)

---

## Step 3: Deploy to Vercel

1. Go to https://vercel.com and sign up with GitHub
2. Click "Import Project"
3. Select your GitHub repository
4. In the **Environment Variables** section, add these:

| Variable Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service_role key |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_UPLOAD_PRESET` | `paras_cloth_store` |
| `GMAIL_USER` | Your Gmail address |
| `GMAIL_APP_PASSWORD` | Your Gmail app password |
| `JWT_SECRET` | Any random long string (e.g., `my-super-secret-key-change-this-123`) |

5. Click **Deploy**
6. Wait for deployment (takes 1-2 minutes)

---

## Step 4: Initial Setup

1. After deployment, Vercel gives you a URL like `https://your-store.vercel.app`
2. Visit `https://your-store.vercel.app/install`
3. Fill in:
   - Shop Name: "Paras Cloth Store Online"
   - Admin Username (choose yours)
   - Password (choose a strong one)
   - Email (for OTP verification)
   - WhatsApp Number (with country code, e.g., 919876543210)
   - Choose theme colors
4. Click "Complete Setup"

---

## Step 5: Start Using!

### Add Products (from your phone):
1. Go to `https://your-store.vercel.app/admin`
2. Login with your username/password
3. Go to Products > Add Product
4. Take photo with your phone camera
5. Fill in name, price, select colors
6. Save!

### Share with Friends:
- Share your website link on WhatsApp
- Print the QR code from Settings and put it in your shop

---

## Custom Domain (Optional)

If you want a custom domain like `parasclothstore.com`:
1. Buy a domain from GoDaddy, Namecheap, or Google Domains (~Rs 800/year)
2. In Vercel, go to Settings > Domains
3. Add your domain and follow DNS instructions

---

## Troubleshooting

### "OTP not received"
- Check Gmail App Password is correct
- Check spam folder
- Make sure 2-Step Verification is enabled on Gmail

### "Images not uploading"
- Check Cloudinary cloud name is correct
- Make sure upload preset is set to "Unsigned"
- Check preset name matches: `paras_cloth_store`

### "Database error"
- Make sure SQL schema was run successfully in Supabase
- Check Supabase URL and keys are correct in Vercel env vars

---

## Need Help?

If anything goes wrong, check the Vercel deployment logs:
1. Go to your Vercel dashboard
2. Click on the latest deployment
3. Check "Function Logs" for errors
