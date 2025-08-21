# Reloading Cost Calculator

A React web application for comparing the cost of reloading ammunition to factory ammunition prices. Built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Component Management**: Add and manage reloading components (brass, powder, primers, bullets) with costs
- **Load Builder**: Create custom ammunition loads with component selection and automatic cost calculation
- **Saved Loads**: Save and manage your favorite load recipes
- **Cost Comparison**: Compare your reloaded ammunition costs against factory ammunition prices
- **Real-time Calculations**: Automatic cost calculations as you build your loads

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Routing**: React Router DOM

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd reloading-calculator
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Set up Database Tables

Run the SQL scripts in the `supabase/tables/` directory in your Supabase SQL editor:

1. **Components Table**: `supabase/tables/components/components_v1.sql`
2. **Saved Loads Table**: `supabase/tables/saved_loads/saved_loads_v1.sql`
3. **Factory Ammo Table**: `supabase/tables/factory_ammo/factory_ammo_v1.sql`

### 4. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Database Schema

### Components Table
Stores individual reloading components:
- `id`: Unique identifier
- `name`: Component name
- `type`: Component type (brass, powder, primer, bullet)
- `cost_per_unit`: Cost per unit
- `unit`: Unit of measurement
- `manufacturer`: Component manufacturer
- `notes`: Additional notes

### Saved Loads Table
Stores complete ammunition load recipes:
- `id`: Unique identifier
- `name`: Load name
- `caliber`: Ammunition caliber
- `brass_id`, `powder_id`, `primer_id`, `bullet_id`: Component references
- `powder_weight`: Powder charge weight in grains
- `total_cost`, `cost_per_round`: Calculated costs
- `notes`: Load notes

### Factory Ammo Table
Stores factory ammunition data for comparison:
- `id`: Unique identifier
- `name`: Product name
- `manufacturer`: Ammunition manufacturer
- `caliber`: Ammunition caliber
- `bullet_weight`: Bullet weight in grains
- `cost_per_box`, `rounds_per_box`: Box pricing information
- `cost_per_round`: Calculated cost per round

## Usage

1. **Add Components**: Start by adding your reloading components (brass, powder, primers, bullets) with their costs
2. **Build Loads**: Create ammunition loads by selecting components and specifying powder charges
3. **Save Loads**: Save your load recipes for future reference
4. **Add Factory Ammo**: Add factory ammunition data for comparison
5. **Compare Costs**: Use the comparison tool to see potential savings from reloading

## Cost Calculation

The application automatically calculates reloading costs based on:
- Brass cost per piece
- Powder cost (converted from grains to cost based on unit pricing)
- Primer cost per piece  
- Bullet cost per piece

Factory ammunition costs are calculated as: `cost_per_box / rounds_per_box`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.