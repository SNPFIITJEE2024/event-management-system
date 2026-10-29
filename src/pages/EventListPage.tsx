import { useEffect, useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X, CalendarHeart, Loader2, Calendar, IndianRupee } from 'lucide-react';
import EventCard from '@/components/EventCard';
import { supabase, CATEGORIES, type EventRow } from '@/lib/supabase';
import { categoryColors } from '@/lib/format';

type SortBy = 'date-asc' | 'date-desc' | 'price-asc' | 'price-desc';

export default function EventListPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCats, setActiveCats] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('date-asc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from('events').select('*').order('event_date', { ascending: true });
      if (cancelled) return;
      if (error) {
        setError(error.message);
      } else {
        setEvents((data ?? []) as EventRow[]);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const toggleCat = (c: string) => {
    setActiveCats((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  };

  const clearFilters = () => {
    setSearch('');
    setActiveCats([]);
    setMaxPrice(10000);
    setDateFrom('');
    setDateTo('');
    setSortBy('date-asc');
  };

  const filtered = useMemo(() => {
    let list = events.filter((e) => {
      const q = search.trim().toLowerCase();
      if (q && !e.title.toLowerCase().includes(q) && !e.location.toLowerCase().includes(q)) return false;
      if (activeCats.length && !activeCats.includes(e.category)) return false;
      if (Number(e.price) > maxPrice) return false;
      if (dateFrom && e.event_date < dateFrom) return false;
      if (dateTo && e.event_date > dateTo) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'date-asc': return a.event_date.localeCompare(b.event_date);
        case 'date-desc': return b.event_date.localeCompare(a.event_date);
        case 'price-asc': return Number(a.price) - Number(b.price);
        case 'price-desc': return Number(b.price) - Number(a.price);
      }
    });
    return list;
  }, [events, search, activeCats, maxPrice, dateFrom, dateTo, sortBy]);

  const activeFilterCount = activeCats.length + (maxPrice < 10000 ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero */}
      <div className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-6 py-12 sm:px-10 sm:py-16">
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold mb-4">
            <CalendarHeart className="w-3.5 h-3.5 text-emerald-400" />
            <span>{events.length} events live now</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3 max-w-2xl">
            Discover & book remarkable events
          </h1>
          <p className="text-slate-300 max-w-xl text-sm sm:text-base">
            Tech summits, cultural fests, hands-on workshops and sports tournaments — all in one place.
          </p>
        </div>
      </div>

      {/* Search & filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-secondary relative"
        >
          <SlidersHorizontal className="w-4 h-4" /> Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="input sm:w-48 cursor-pointer"
        >
          <option value="date-asc">Date (Earliest)</option>
          <option value="date-desc">Date (Latest)</option>
          <option value="price-asc">Price (Low-High)</option>
          <option value="price-desc">Price (High-Low)</option>
        </select>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((c) => {
          const cat = categoryColors[c];
          const active = activeCats.includes(c);
          return (
            <button
              key={c}
              onClick={() => toggleCat(c)}
              className={`chip border ${
                active
                  ? `${cat.bg} ${cat.text} border-transparent ring-2 ring-offset-1 ring-slate-900/20`
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
              {c}
            </button>
          );
        })}
      </div>

      {/* Expandable filter panel */}
      {showFilters && (
        <div className="card p-5 mb-6 animate-fade-in">
          <div className="grid sm:grid-cols-3 gap-5">
            <div>
              <label className="label flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5" /> Max Price: ₹{maxPrice.toLocaleString('en-IN')}</label>
              <input
                type="range"
                min={0}
                max={10000}
                step={100}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-slate-900"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>₹0</span><span>₹10,000</span>
              </div>
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> From Date</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> To Date</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input" />
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="btn-ghost text-xs mt-4 text-rose-600 hover:bg-rose-50">
              <X className="w-3.5 h-3.5" /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p className="text-sm">Loading events...</p>
        </div>
      ) : error ? (
        <div className="card p-8 text-center text-rose-600">
          <p className="font-semibold mb-1">Couldn't load events</p>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <CalendarHeart className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="font-bold text-slate-900 mb-1">No events found</h3>
          <p className="text-sm text-slate-500 mb-4">Try adjusting your search or filters.</p>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="btn-secondary text-sm mx-auto">Clear filters</button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-4 font-medium">
            Showing <span className="font-bold text-slate-800">{filtered.length}</span> {filtered.length === 1 ? 'event' : 'events'}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
