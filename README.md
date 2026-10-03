# 🎯 Jackpot Harness

**Jackpot Harness** is a high-performance football (soccer) jackpot intelligence, exploration, and prediction engine. Built on a dataset of **42,898+ historical jackpot match records** across major Kenyan and European bookmakers (**Betika**, **Mozzart**, and **SportPesa**), Jackpot Harness provides deep statistical modeling, position-by-position bias analysis, head-to-head simulations, and real-time score likelihood projections for upcoming jackpots.

---

## 🌟 Key Features

### 1. 🔮 Jackpot Predictor (Positions 1–17)
- **Position-Aware Modeling**: Computes baseline outcome probabilities for each row (1 to 17) based on historical jackpot tendencies and bookmaker placement biases.
- **Poisson Score Simulation**: Simulates exact score probabilities (e.g. 1-0, 2-1, 1-1, 0-0) using bivariate Poisson goal expectation models.
- **Custom Fixture Input**: Enter any upcoming match fixture with real-time team autocomplete (`TeamSearchInput`) to blend team form, head-to-head history, and position priors.
- **Outcome & Confidence Ratings**: Delivers projected 1X2 distribution percentages (`Home % | Draw % | Away %`), predicted outcome (`1`, `X`, `2`), and confidence levels.

### 2. 📊 Historical Position Matrix
- **Row-by-Row Statistical Breakdown**: Evaluates historical match distribution across all jackpot rows (1 through 17+).
- **Outcome Distribution**: Analyzes whether specific positions historically trend towards home wins, draws, or away upsets.
- **Goal Trends & Most Likely Scores**: Tracks average goals per row and top recurring scorelines.

### 3. ⚔️ Head-to-Head (H2H) & Team Intelligence
- **Instant Team Comparison**: Search any two teams across 3,500+ clubs in the database with game appearance frequency rankings.
- **Comprehensive Match History**: Displays wins, draws, losses, total goals scored/conceded, and clean sheet rates.
- **Most Frequent Scorelines**: Highlights historical recurring scorelines between two opposing sides.
- **Recent Form Tracker**: Measures last 5 to 10 match performance, goal averages, and momentum.

### 4. ⚽ Goal & Market Analytics
- **Over/Under Analysis**: Probability and historical frequencies for Over/Under 1.5, 2.5, and 3.5 goals.
- **Both Teams to Score (BTTS)**: Detailed tracking of BTTS Yes vs. No rates.
- **Clean Sheets & Scoreless Rates**: Rates of zero-goal matches, home clean sheets, and away shutouts.
- **Goal Frequency Distributions**: Breakdown of total goals scored per match (0 to 6+ goals).

### 5. 🔍 Data Explorer & Interactive Grid
- **TanStack Table Engine**: High-performance sorting, pagination, and multi-column filtering.
- **Advanced Filtering**: Filter by bookmaker, jackpot product, outcome, date range, league, or team.
- **Multi-Row Action Toolbar**: Floating batch toolbar for selected rows with one-click actions (H2H comparison, Position analysis, Goal trends).
- **Match Detail Drawer**: Deep-dive sheet for any match showing odds, score, league, and related fixtures.
- **Export Capabilities**: Export filtered or full datasets to JSON or CSV.

---

## 🏗️ Architecture & Tech Stack

### Frontend & Analytics
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool & Bundler**: [Vite 8](https://vite.dev/)
- **Package Manager**: [Bun](https://bun.sh/)
- **UI & Styling**: [Tailwind CSS v4](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/), [Base UI](https://base-ui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Tables & State**: [TanStack Table v8](https://tanstack.com/table/v8), [TanStack Query v5](https://tanstack.com/query/v5)
- **Charts & Visualization**: [Recharts](https://recharts.org/)

### Data Pipeline & Normalization
- **Runtime**: Python 3.14 via [`uv`](https://github.com/astral-sh/uv)
- **Source Data**: Raw scrapings from Betika, Mozzart, and SportPesa stored in `data/raw/` (read-only)
- **Normalization Script**: `src/build_json.py` converts raw heterogeneous formats (CRLF/LF, mixed date formats, varying headers) into canonical snake_case JSON under `data/processed/`.

---

## 📁 Repository Layout

```text
.
├── AGENTS.md                    # Agent rules, database quirks, and conventions
├── README.md                    # Project documentation
├── package.json                 # Node dependencies and scripts
├── bun.lock                     # Bun dependency lockfile
├── vite.config.ts               # Vite configuration with Tailwind CSS v4 plugin
├── data/
│   ├── raw/                     # Read-only raw scraped CSV and JSON datasets
│   │   ├── betika/              # Betika Grand, Mega, Midweek, Must-Be-Won
│   │   ├── mozzart/             # Mozzart Super Jackpot & Super Grand Jackpot
│   │   └── sportpesa/           # SportPesa Mega Jackpot Pro (CSV & nested JSON)
│   └── processed/               # Normalized JSON files used by the web application
├── src/
│   ├── build_json.py            # ETL script generating data/processed from data/raw
│   ├── App.tsx                  # Main application shell and tab router
│   ├── components/
│   │   ├── common/              # Reusable widgets (TeamSearchInput autocomplete)
│   │   ├── explorer/            # Match table, filters, floating toolbar, modals
│   │   ├── predictor/           # 1–17 jackpot predictor and Poisson simulation
│   │   ├── positions/           # Position matrix and row bias analyzer
│   │   ├── teams/               # Head-to-head and team form analyzer
│   │   ├── goals/               # Over/Under, BTTS, and goal frequency analytics
│   │   ├── layout/              # Header, navigation tabs, dataset stats
│   │   └── ui/                  # Shadcn UI primitives
│   ├── hooks/                   # Custom React hooks (useJackpotMatches, useUrlFilters)
│   └── lib/                     # Domain logic (predictions, positions, teams, goals)
└── public/                      # Static assets and processed dataset mirrors
```

---

## 🚀 Getting Started

### Prerequisites
- **[Bun](https://bun.sh/)** (recommended package manager)
- **[uv](https://github.com/astral-sh/uv)** (for Python ETL pipeline, optional if using pre-built JSON)

### 1. Installation

Clone the repository and install dependencies with Bun:

```bash
git clone https://github.com/your-username/jackpot-harness.git
cd "jackpot-harness"

bun install
```

### 2. (Optional) Rebuild Processed Data

If updating or modifying raw data files in `data/raw/`, regenerate the normalized JSON files:

```bash
bun run build:data
# or directly:
uv run python src/build_json.py
```

### 3. Start Development Server

Launch the Vite development server:

```bash
bun run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production

Compile TypeScript and build the optimized production bundle:

```bash
bun run build
```

Preview the production build locally:

```bash
bun run preview
```

---

## 📐 Prediction Engine Methodology

Jackpot Harness employs a multi-factor estimation algorithm:

1. **Position Priors**: Extracts historical baseline probabilities for each row index (1–17). Bookmakers often structure jackpots with distinct game profiles across specific rows.
2. **Head-to-Head Weighting**: When home and away teams are selected, historical H2H matchups are evaluated for win ratios, goal averages, and dominance factors.
3. **Team Momentum & Goal Expectancy**: Incorporates recent scoring rates ($\lambda_{\text{home}}$ and $\mu_{\text{away}}$) to calibrate expected goals.
4. **Poisson Score Distribution**:
   $$P(X = x, Y = y) = \frac{\lambda^x e^{-\lambda}}{x!} \times \frac{\mu^y e^{-\mu}}{y!}$$
   Generates a matrix of probabilities for scorelines up to 6–6, calculating exact probabilities for Home Win, Draw, and Away Win, along with the most likely correct scoreline.

---

## 📄 License

Private repository / All rights reserved. Built for jackpot analytics and sports data modeling research.
