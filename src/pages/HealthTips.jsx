import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HeartPulse, Sparkles, Flame, Droplets, Utensils, Activity, 
  Download, Search, Bookmark, BookmarkCheck, CheckCircle2, 
  Info, ShieldAlert, Dumbbell, Moon, Apple, Calculator, FileText,
  Printer, ArrowRight, RefreshCw, Zap, Lightbulb, Plus, Minus, RotateCcw
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';

// Health Tips Dataset
const HEALTH_TIPS_DATA = [
  {
    id: 'tip-1',
    title: 'Never Take Medications with Grapefruit Juice',
    category: 'Medication',
    icon: ShieldAlert,
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    summary: 'Grapefruit can block enzymes that break down certain blood pressure and cholesterol drugs, leading to dangerously high levels in your system.',
    details: 'Always check with your pharmacist regarding food-drug interactions. Water is always the safest liquid for swallowing pills.'
  },
  {
    id: 'tip-2',
    title: 'Optimal Hydration Rule (35ml per kg)',
    category: 'Hydration',
    icon: Droplets,
    badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    summary: 'Drink at least 35ml of water per kilogram of body weight daily. Hydration keeps blood volume stable and helps kidney drug excretion.',
    details: 'If taking water pills (diuretics), follow doctor specific fluid intake limits strictly.'
  },
  {
    id: 'tip-3',
    title: 'Timing Fat-Soluble Vitamins Correctly',
    category: 'Nutrition',
    icon: Apple,
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    summary: 'Vitamins A, D, E, and K absorb best when taken alongside meals containing healthy fats like healthy oils, nuts, or avocado.',
    details: 'Taking fat-soluble supplements on an empty stomach can reduce absorption by up to 50%.'
  },
  {
    id: 'tip-4',
    title: 'The 20-20-20 Rule for Digital Eye Strain',
    category: 'Wellness',
    icon: Lightbulb,
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    summary: 'Every 20 minutes, look at an object 20 feet away for 20 seconds to prevent headaches and eye fatigue from screens.',
    details: 'Combine this with gentle blinking exercise to keep eyes lubricated throughout long screen sessions.'
  },
  {
    id: 'tip-5',
    title: 'Consistent Bedtime for Hormone Balance',
    category: 'Sleep',
    icon: Moon,
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    summary: 'Sleeping and waking up at the exact same times stabilizes melatonin and cortisol, optimizing metabolism and mental clarity.',
    details: 'Avoid taking stimulants or heavy meals within 3 hours before going to sleep.'
  },
  {
    id: 'tip-6',
    title: 'Post-Meal 10-Minute Light Walk',
    category: 'Fitness',
    icon: Dumbbell,
    badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
    summary: 'A brief 10-minute walk after lunch or dinner reduces postprandial glucose spikes by up to 22%.',
    details: 'Helps digest food comfortably and improves insulin sensitivity across all age groups.'
  }
];

export default function HealthTips() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('generator'); // 'generator', 'tips'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('saved_health_tips') || '[]');
    } catch {
      return [];
    }
  });

  // Calorie & Macro Calculator State
  const [calcForm, setCalcForm] = useState({
    gender: 'male',
    age: 25,
    weight: 70, // kg
    height: 172, // cm
    activity: 'moderate', // sedentary, light, moderate, active, extreme
    goal: 'maintain', // weight_loss, mild_loss, maintain, mild_gain, weight_gain
  });

  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Daily Consumed Calories Progress State
  const [consumedCalories, setConsumedCalories] = useState(() => {
    try {
      return parseInt(localStorage.getItem('daily_consumed_calories') || '1350');
    } catch {
      return 1350;
    }
  });

  const [customCalInput, setCustomCalInput] = useState('');

  const handleUpdateConsumed = (amount) => {
    const newVal = Math.max(0, consumedCalories + amount);
    setConsumedCalories(newVal);
    localStorage.setItem('daily_consumed_calories', newVal.toString());
  };

  const handleCustomCalAdd = (e) => {
    e.preventDefault();
    const val = parseInt(customCalInput);
    if (!isNaN(val) && val > 0) {
      handleUpdateConsumed(val);
      setCustomCalInput('');
      toast.success(`Added ${val} kcal to daily intake log! 🥗`);
    }
  };

  const handleResetConsumed = () => {
    setConsumedCalories(0);
    localStorage.setItem('daily_consumed_calories', '0');
    toast.success('Reset daily calorie intake log to 0 kcal');
  };

  // Toggle Tip Bookmark
  const toggleBookmark = (id) => {
    let updated;
    if (bookmarks.includes(id)) {
      updated = bookmarks.filter(b => b !== id);
      toast.success('Tip removed from saved bookmarks');
    } else {
      updated = [...bookmarks, id];
      toast.success('Tip saved to bookmarks! 📌');
    }
    setBookmarks(updated);
    localStorage.setItem('saved_health_tips', JSON.stringify(updated));
  };

  // Filtered Tips
  const filteredTips = useMemo(() => {
    return HEALTH_TIPS_DATA.filter(tip => {
      const matchesCategory = selectedCategory === 'All' || tip.category === selectedCategory;
      const matchesSearch = tip.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            tip.summary.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Calculate Calorie Metrics (Mifflin-St Jeor Equation)
  const calculateCalories = () => {
    setIsGenerating(true);

    setTimeout(() => {
      const { gender, age, weight, height, activity, goal } = calcForm;
      const w = parseFloat(weight) || 70;
      const h = parseFloat(height) || 170;
      const a = parseInt(age) || 25;

      // 1. Basal Metabolic Rate (BMR)
      let bmr = (10 * w) + (6.25 * h) - (5 * a);
      if (gender === 'male') {
        bmr += 5;
      } else {
        bmr -= 161;
      }

      // 2. Activity Multiplier (TDEE)
      const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        extreme: 1.9
      };
      const tdee = Math.round(bmr * (activityMultipliers[activity] || 1.55));

      // 3. Goal Calorie Adjustment
      let targetCalories = tdee;
      if (goal === 'weight_loss') targetCalories = Math.round(tdee - 500);
      else if (goal === 'mild_loss') targetCalories = Math.round(tdee - 250);
      else if (goal === 'mild_gain') targetCalories = Math.round(tdee + 250);
      else if (goal === 'weight_gain') targetCalories = Math.round(tdee + 500);

      // Safe minimum calorie floors
      if (gender === 'female' && targetCalories < 1200) targetCalories = 1200;
      if (gender === 'male' && targetCalories < 1500) targetCalories = 1500;

      // 4. Macronutrients Breakdown
      // Protein: 2.0g/kg for gain/loss or 1.8g/kg
      const proteinGrams = Math.round(w * (goal.includes('gain') ? 2.2 : 1.8));
      const proteinCalories = proteinGrams * 4;

      // Fat: 25% of target calories
      const fatCalories = Math.round(targetCalories * 0.25);
      const fatGrams = Math.round(fatCalories / 9);

      // Carbs: Remaining calories
      const carbCalories = Math.max(0, targetCalories - proteinCalories - fatCalories);
      const carbGrams = Math.round(carbCalories / 4);

      // 5. Daily Water Intake (35ml per kg + activity boost)
      const waterLiters = ((w * 35 + (activity === 'active' || activity === 'extreme' ? 500 : 250)) / 1000).toFixed(1);

      // 6. Sample Daily Meal Plan
      const mealPlan = {
        breakfast: {
          title: 'Power Protein Breakfast',
          calories: Math.round(targetCalories * 0.25),
          items: ['Oatmeal or red rice string hoppers with boiled egg / lentils', 'Fresh papaya or apple slice', 'Green tea / sugar-free herbal tea']
        },
        lunch: {
          title: 'Balanced Vitality Lunch',
          calories: Math.round(targetCalories * 0.35),
          items: ['Whole grain rice or quinoa (1-1.5 cups)', 'Grilled chicken, fish or dhal/tofu', 'Steamed green leafy vegetables & fresh cucumber salad']
        },
        snack: {
          title: 'Mid-Day Hydration & Energy Snack',
          calories: Math.round(targetCalories * 0.15),
          items: ['Handful of almonds / roasted chickpeas', '1 Glass of fresh coconut water or lime water without added sugar']
        },
        dinner: {
          title: 'Light Recovery Supper',
          calories: Math.round(targetCalories * 0.25),
          items: ['Vegetable soup with lean protein', 'Sautéed broccoli/spinach', 'Warm glass of low-fat golden turmeric milk']
        }
      };

      setGeneratedPlan({
        bmr: Math.round(bmr),
        tdee,
        targetCalories,
        waterLiters,
        macros: {
          protein: { grams: proteinGrams, calories: proteinCalories, pct: Math.round((proteinCalories/targetCalories)*100) },
          carbs: { grams: carbGrams, calories: carbCalories, pct: Math.round((carbCalories/targetCalories)*100) },
          fat: { grams: fatGrams, calories: fatCalories, pct: Math.round((fatCalories/targetCalories)*100) },
        },
        mealPlan,
        calculatedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      });

      setIsGenerating(false);
      toast.success('Personalized Calorie & Health Plan Generated! 🔥');
    }, 400);
  };

  // PDF Export Function
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const activePlan = generatedPlan || {
        targetCalories: 2150,
        bmr: 1620,
        tdee: 2200,
        waterLiters: '2.6',
        macros: { protein: { grams: 140 }, carbs: { grams: 230 }, fat: { grams: 60 } }
      };

      // Header Banner
      doc.setFillColor(2, 132, 199); // Teal / Primary
      doc.rect(0, 0, 210, 32, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('MediRemind Health & Calorie Report', 14, 18);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated for: ${user?.email || 'Valued User'} | Date: ${new Date().toLocaleDateString()}`, 14, 26);

      // Section 1: Calorie Summary
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Personalized Calorie & Hydration Goals', 14, 44);

      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 48, 182, 36, 3, 3, 'FD');

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(2, 132, 199);
      doc.text(`Daily Calorie Target: ${activePlan.targetCalories} kcal / day`, 20, 58);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(`• Basal Metabolic Rate (BMR): ${activePlan.bmr} kcal`, 20, 66);
      doc.text(`• Total Energy Expenditure (TDEE): ${activePlan.tdee} kcal`, 20, 73);
      doc.text(`• Recommended Hydration Target: ${activePlan.waterLiters} Liters / day`, 105, 66);

      // Section 2: Macro Breakdown
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('2. Recommended Daily Macronutrients', 14, 96);

      doc.roundedRect(14, 100, 182, 28, 3, 3, 'FD');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129); // Protein green
      doc.text(`Protein: ${activePlan.macros.protein.grams}g`, 24, 112);

      doc.setTextColor(245, 158, 11); // Carbs amber
      doc.text(`Carbohydrates: ${activePlan.macros.carbs.grams}g`, 84, 112);

      doc.setTextColor(239, 68, 68); // Fat red
      doc.text(`Healthy Fats: ${activePlan.macros.fat.grams}g`, 148, 112);

      // Section 3: Essential Health & Medication Rules
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('3. Essential Medication & Wellness Rules', 14, 140);

      let yPos = 148;
      HEALTH_TIPS_DATA.slice(0, 4).forEach((tip, idx) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(2, 132, 199);
        doc.text(`${idx + 1}. ${tip.title}`, 16, yPos);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const splitText = doc.splitTextToSize(tip.summary, 175);
        doc.text(splitText, 20, yPos + 5);
        yPos += 16;
      });

      // Footer
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text('MediRemind Health Companion — Always consult your physician for clinical advice.', 14, 280);

      // Save PDF
      doc.save(`MediRemind_Health_Calorie_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('Health & Calorie Report downloaded as PDF! 📄');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Could not generate PDF. Please try again.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <PageHeader 
        title="Health Tips & Calorie Generator" 
        subtitle="Personalized daily wellness guidelines, smart calorie calculator, and downloadable PDF reports."
      />

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 bg-slate-200/60 dark:bg-slate-900 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'generator'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calculator size={17} /> Calorie & Plan Generator
          </button>
          <button
            onClick={() => setActiveTab('tips')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'tips'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HeartPulse size={17} /> Health & Wellness Tips
          </button>
        </div>

        {/* Global PDF Download Button */}
        <Button 
          onClick={handleDownloadPDF}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-2 text-xs sm:text-sm"
        >
          <Download size={17} /> Download PDF Report
        </Button>
      </div>

      {/* TAB 1: CALORIE & PLAN GENERATOR */}
      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calculator Input Form */}
          <div className="lg:col-span-5 space-y-6">
            <Card>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                <Flame size={20} className="text-amber-500" /> Daily Calorie Calculator
              </h3>

              <div className="space-y-4">
                {/* Gender selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Gender
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCalcForm(p => ({ ...p, gender: 'male' }))}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        calcForm.gender === 'male'
                          ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400'
                          : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500'
                      }`}
                    >
                      Male 👨
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcForm(p => ({ ...p, gender: 'female' }))}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        calcForm.gender === 'female'
                          ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400'
                          : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500'
                      }`}
                    >
                      Female 👩
                    </button>
                  </div>
                </div>

                {/* Age, Weight, Height */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Age (yrs)
                    </label>
                    <input 
                      type="number" 
                      min="10" 
                      max="120"
                      value={calcForm.age}
                      onChange={(e) => setCalcForm(p => ({ ...p, age: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Weight (kg)
                    </label>
                    <input 
                      type="number" 
                      min="30" 
                      max="250"
                      value={calcForm.weight}
                      onChange={(e) => setCalcForm(p => ({ ...p, weight: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Height (cm)
                    </label>
                    <input 
                      type="number" 
                      min="100" 
                      max="230"
                      value={calcForm.height}
                      onChange={(e) => setCalcForm(p => ({ ...p, height: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Activity Level */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Daily Activity Level
                  </label>
                  <select
                    value={calcForm.activity}
                    onChange={(e) => setCalcForm(p => ({ ...p, activity: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="sedentary">Sedentary (Little or no exercise)</option>
                    <option value="light">Lightly Active (Exercise 1-3 days/week)</option>
                    <option value="moderate">Moderately Active (Exercise 3-5 days/week)</option>
                    <option value="active">Very Active (Hard exercise 6-7 days/week)</option>
                    <option value="extreme">Extremely Active (Athletic training / physical job)</option>
                  </select>
                </div>

                {/* Health Goal */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Health & Weight Goal
                  </label>
                  <select
                    value={calcForm.goal}
                    onChange={(e) => setCalcForm(p => ({ ...p, goal: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="weight_loss">Weight Loss (-0.5 kg/week)</option>
                    <option value="mild_loss">Mild Weight Loss (-0.25 kg/week)</option>
                    <option value="maintain">Maintain Current Weight</option>
                    <option value="mild_gain">Mild Weight Gain (+0.25 kg/week)</option>
                    <option value="weight_gain">Muscle & Weight Gain (+0.5 kg/week)</option>
                  </select>
                </div>

                <Button 
                  onClick={calculateCalories}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 text-slate-950 font-bold py-3 rounded-xl shadow-lg shadow-teal-500/20 justify-center"
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw size={16} className="animate-spin" /> Calculating BMR & TDEE...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap size={16} /> Calculate Calorie Plan
                    </span>
                  )}
                </Button>
              </div>
            </Card>
          </div>

          {/* Generated Plan Output */}
          <div className="lg:col-span-7 space-y-6">
            {generatedPlan ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white dark:bg-slate-900 border border-teal-500/30 p-4 rounded-2xl text-center space-y-1 shadow-md">
                    <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">Target Calories</span>
                    <p className="text-xl font-black text-teal-600 dark:text-teal-400">{generatedPlan.targetCalories}</p>
                    <span className="text-[10px] text-slate-400">kcal / day</span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-center space-y-1 shadow-sm">
                    <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">BMR</span>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{generatedPlan.bmr}</p>
                    <span className="text-[10px] text-slate-400">Basal metabolic</span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-center space-y-1 shadow-sm">
                    <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">TDEE</span>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{generatedPlan.tdee}</p>
                    <span className="text-[10px] text-slate-400">Total expenditure</span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-cyan-500/30 p-4 rounded-2xl text-center space-y-1 shadow-sm">
                    <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">Daily Water</span>
                    <p className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{generatedPlan.waterLiters} L</p>
                    <span className="text-[10px] text-slate-400">Hydration target</span>
                  </div>
                </div>

                {/* Visual Daily Caloric Intake Progress Bar */}
                <Card className="border-teal-500/20 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Flame size={18} className="text-amber-500" /> Daily Calorie Intake Progress
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Track food intake against your daily recommended goal of {generatedPlan.targetCalories} kcal
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                        (consumedCalories / generatedPlan.targetCalories) > 1.05 
                          ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' 
                          : 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20'
                      }`}>
                        {Math.round((consumedCalories / generatedPlan.targetCalories) * 100)}% Goal
                      </span>
                      <button 
                        onClick={handleResetConsumed}
                        title="Reset daily log"
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
                      >
                        <RotateCcw size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Visual Animated Progress Bar */}
                  <div className="space-y-2">
                    <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-7 rounded-2xl p-1 border border-slate-200/80 dark:border-slate-800 overflow-hidden relative shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (consumedCalories / generatedPlan.targetCalories) * 100)}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={`h-full rounded-xl flex items-center justify-end pr-2.5 transition-colors ${
                          (consumedCalories / generatedPlan.targetCalories) > 1.0
                            ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                            : (consumedCalories / generatedPlan.targetCalories) > 0.85
                            ? 'bg-gradient-to-r from-teal-500 via-emerald-500 to-amber-500'
                            : 'bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500'
                        }`}
                      >
                        {((consumedCalories / generatedPlan.targetCalories) * 100) >= 15 && (
                          <span className="text-[10px] font-black text-slate-950 tracking-tight">
                            {consumedCalories} kcal
                          </span>
                        )}
                      </motion.div>
                    </div>

                    {/* Numerical Breakdown Row */}
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 px-1">
                      <span>Consumed: <strong className="text-teal-600 dark:text-teal-400">{consumedCalories} kcal</strong></span>
                      <span>
                        {consumedCalories > generatedPlan.targetCalories ? (
                          <span className="text-rose-500 font-extrabold">Exceeded by {consumedCalories - generatedPlan.targetCalories} kcal</span>
                        ) : (
                          <span>Remaining: <strong className="text-emerald-600 dark:text-emerald-400">{generatedPlan.targetCalories - consumedCalories} kcal</strong></span>
                        )}
                      </span>
                      <span className="text-slate-400">Target: {generatedPlan.targetCalories} kcal</span>
                    </div>
                  </div>

                  {/* Interactive Calorie Quick Log Controls */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                      Quick Log Meal / Snack Calories
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleUpdateConsumed(150)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-400 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1"
                      >
                        <Plus size={13} /> 150 kcal (Light Snack)
                      </button>
                      <button
                        onClick={() => handleUpdateConsumed(350)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-400 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1"
                      >
                        <Plus size={13} /> 350 kcal (Light Meal)
                      </button>
                      <button
                        onClick={() => handleUpdateConsumed(500)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-400 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1"
                      >
                        <Plus size={13} /> 500 kcal (Main Meal)
                      </button>

                      {/* Custom Input */}
                      <form onSubmit={handleCustomCalAdd} className="flex items-center gap-1.5 ml-auto w-full sm:w-auto">
                        <input
                          type="number"
                          placeholder="Custom kcal"
                          value={customCalInput}
                          onChange={(e) => setCustomCalInput(e.target.value)}
                          className="w-24 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all"
                        >
                          Add
                        </button>
                      </form>
                    </div>
                  </div>
                </Card>

                {/* Macros Breakdown */}
                <Card>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Utensils size={16} className="text-teal-500" /> Daily Macro Breakdown
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">Protein</span>
                      <span className="text-base font-black text-slate-900 dark:text-white">{generatedPlan.macros.protein.grams}g</span>
                      <span className="text-[10px] text-slate-500 block">{generatedPlan.macros.protein.pct}% calories</span>
                    </div>

                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block">Carbs</span>
                      <span className="text-base font-black text-slate-900 dark:text-white">{generatedPlan.macros.carbs.grams}g</span>
                      <span className="text-[10px] text-slate-500 block">{generatedPlan.macros.carbs.pct}% calories</span>
                    </div>

                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">Healthy Fat</span>
                      <span className="text-base font-black text-slate-900 dark:text-white">{generatedPlan.macros.fat.grams}g</span>
                      <span className="text-[10px] text-slate-500 block">{generatedPlan.macros.fat.pct}% calories</span>
                    </div>
                  </div>
                </Card>

                {/* Sample Meal Plan */}
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-500" /> Suggested Daily Meal Schedule
                    </h4>
                    <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full">
                      Custom Plan
                    </span>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(generatedPlan.mealPlan).map(([key, meal]) => (
                      <div key={key} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-xl">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                            {meal.title}
                          </span>
                          <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                            ~{meal.calories} kcal
                          </span>
                        </div>
                        <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                          {meal.items.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ) : (
              <Card className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-teal-500/10 border border-teal-500/20 text-teal-500 flex items-center justify-center">
                  <Calculator size={32} />
                </div>
                <div className="max-w-md space-y-1">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">Calculate Your Daily Calorie Goal</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Fill in your physical attributes on the left and click <strong>Calculate Calorie Plan</strong> to view BMR, TDEE, macros, and customized meal schedule.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: HEALTH & WELLNESS TIPS */}
      {activeTab === 'tips' && (
        <div className="space-y-6">
          {/* Search & Category Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search health tips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
              {['All', 'Medication', 'Hydration', 'Nutrition', 'Wellness', 'Sleep', 'Fitness'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-teal-500 text-slate-950 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tips Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTips.map(tip => {
              const IconComp = tip.icon;
              const isSaved = bookmarks.includes(tip.id);

              return (
                <Card key={tip.id} className="relative flex flex-col justify-between hover:border-teal-500/40 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${tip.badgeColor}`}>
                        {tip.category}
                      </span>
                      <button 
                        onClick={() => toggleBookmark(tip.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-500 transition-colors"
                      >
                        {isSaved ? <BookmarkCheck size={18} className="text-teal-500 fill-teal-500/20" /> : <Bookmark size={18} />}
                      </button>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-500 flex items-center justify-center shrink-0">
                        <IconComp size={20} />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {tip.title}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {tip.summary}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 italic">
                    💡 {tip.details}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
