import { useEffect, useState } from 'react';
import { useNavigate, useParams } from '@/lib/router';
import { Loader2, Save, CalendarPlus, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { supabase, CATEGORIES, type Category } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

type FormData = {
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  category: string;
  total_capacity: string;
  price: string;
  banner_image: string;
};

type Errors = Partial<Record<keyof FormData, string>>;

const initial: FormData = {
  title: '', description: '', event_date: '', event_time: '',
  location: '', category: 'Tech', total_capacity: '', price: '0', banner_image: '',
};

const today = new Date().toISOString().split('T')[0];

export default function CreateEventPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState<FormData>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
      if (cancelled) return;
      if (data) {
        const e = data as any;
        setForm({
          title: e.title,
          description: e.description,
          event_date: e.event_date,
          event_time: e.event_time,
          location: e.location,
          category: e.category,
          total_capacity: String(e.total_capacity),
          price: String(e.price),
          banner_image: e.banner_image ?? '',
        });
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id, isEdit]);

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-rose-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-1">Admin access required</h2>
        <p className="text-sm text-slate-500 mb-6">Use the "Demo Admin" button in the navbar to access this page.</p>
      </div>
    );
  }

  const validate = (data: FormData): Errors => {
    const e: Errors = {};
    if (!data.title.trim()) e.title = 'Title is required';
    else if (data.title.trim().length < 3) e.title = 'Title must be at least 3 characters';
    else if (data.title.length > 80) e.title = 'Title must be under 80 characters';

    if (!data.description.trim()) e.description = 'Description is required';
    else if (data.description.trim().length < 15) e.description = 'Description must be at least 15 characters';

    if (!data.event_date) e.event_date = 'Date is required';
    else if (!isEdit && data.event_date < today) e.event_date = 'Date cannot be in the past';

    if (!data.event_time) e.event_time = 'Time is required';

    if (!data.location.trim()) e.location = 'Location is required';
    else if (data.location.trim().length < 3) e.location = 'Location must be at least 3 characters';

    if (!data.category) e.category = 'Category is required';

    const cap = Number(data.total_capacity);
    if (!data.total_capacity) e.total_capacity = 'Capacity is required';
    else if (isNaN(cap)) e.total_capacity = 'Capacity must be a number';
    else if (cap <= 0) e.total_capacity = 'Capacity must be greater than 0';
    else if (!Number.isInteger(cap)) e.total_capacity = 'Capacity must be a whole number';
    else if (cap > 100000) e.total_capacity = 'Capacity seems too large';

    const price = Number(data.price);
    if (data.price === '') e.price = 'Price is required';
    else if (isNaN(price)) e.price = 'Price must be a number';
    else if (price < 0) e.price = 'Price cannot be negative';
    else if (price > 1000000) e.price = 'Price seems too large';

    if (data.banner_image && !/^https?:\/\/.+/.test(data.banner_image.trim()))
      e.banner_image = 'Must be a valid URL starting with http:// or https://';

    return e;
  };

  const update = (field: keyof FormData, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast('Please fix the errors in the form', 'error');
      return;
    }
    setSubmitting(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      event_date: form.event_date,
      event_time: form.event_time,
      location: form.location.trim(),
      category: form.category as Category,
      total_capacity: Number(form.total_capacity),
      price: Number(form.price),
      banner_image: form.banner_image.trim() || null,
      created_by: user?.email ?? null,
    };

    if (isEdit && id) {
      const { error } = await supabase.from('events').update({
        title: payload.title,
        description: payload.description,
        event_date: payload.event_date,
        event_time: payload.event_time,
        location: payload.location,
        category: payload.category,
        total_capacity: payload.total_capacity,
        price: payload.price,
        banner_image: payload.banner_image,
      }).eq('id', id);
      setSubmitting(false);
      if (error) {
        toast(error.message || 'Failed to update event', 'error');
        return;
      }
      toast('Event updated successfully', 'success');
      navigate(`/events/${id}`);
    } else {
      const { data, error } = await supabase.from('events').insert({
        ...payload,
        available_seats: payload.total_capacity,
      }).select().single();
      setSubmitting(false);
      if (error) {
        toast(error.message || 'Failed to create event', 'error');
        return;
      }
      toast('Event created successfully', 'success');
      navigate(`/events/${(data as any).id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p className="text-sm">Loading event...</p>
      </div>
    );
  }

  const Field = ({ name, label, children, hint }: { name: keyof FormData; label: string; children: React.ReactNode; hint?: string }) => (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && !errors[name] && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      {errors[name] && (
        <p className="text-xs text-rose-600 mt-1 font-medium flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center">
          {isEdit ? <Save className="w-5 h-5 text-emerald-400" /> : <CalendarPlus className="w-5 h-5 text-emerald-400" />}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{isEdit ? 'Edit Event' : 'Create New Event'}</h1>
          <p className="text-sm text-slate-500">{isEdit ? 'Update event details' : 'Fill in the details to publish a new event'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <Field name="title" label="Event Title">
          <input
            type="text"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="e.g. AI & ML Summit 2026"
            className={`input ${errors.title ? 'border-rose-300 focus:ring-rose-100' : ''}`}
            maxLength={80}
          />
        </Field>

        <Field name="description" label="Description" hint="Minimum 15 characters">
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Describe what the event is about, agenda, speakers..."
            rows={4}
            className={`input resize-y ${errors.description ? 'border-rose-300 focus:ring-rose-100' : ''}`}
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field name="event_date" label="Event Date" hint="Cannot be a past date">
            <input
              type="date"
              value={form.event_date}
              min={today}
              onChange={(e) => update('event_date', e.target.value)}
              className={`input ${errors.event_date ? 'border-rose-300 focus:ring-rose-100' : ''}`}
            />
          </Field>
          <Field name="event_time" label="Event Time">
            <input
              type="time"
              value={form.event_time}
              onChange={(e) => update('event_time', e.target.value)}
              className={`input ${errors.event_time ? 'border-rose-300 focus:ring-rose-100' : ''}`}
            />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field name="location" label="Location / Venue">
            <input
              type="text"
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
              placeholder="e.g. IIT Delhi, Seminar Hall 2"
              className={`input ${errors.location ? 'border-rose-300 focus:ring-rose-100' : ''}`}
            />
          </Field>
          <Field name="category" label="Category">
            <select
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
              className={`input cursor-pointer ${errors.category ? 'border-rose-300' : ''}`}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field name="total_capacity" label="Total Capacity / Seats" hint="Must be a positive whole number">
            <input
              type="number"
              value={form.total_capacity}
              onChange={(e) => update('total_capacity', e.target.value)}
              placeholder="e.g. 200"
              min={1}
              className={`input ${errors.total_capacity ? 'border-rose-300 focus:ring-rose-100' : ''}`}
            />
          </Field>
          <Field name="price" label="Price (₹)" hint="Use 0 for free events">
            <input
              type="number"
              value={form.price}
              onChange={(e) => update('price', e.target.value)}
              placeholder="e.g. 500"
              min={0}
              step="any"
              className={`input ${errors.price ? 'border-rose-300 focus:ring-rose-100' : ''}`}
            />
          </Field>
        </div>

        <Field name="banner_image" label="Banner Image URL" hint="Optional — leave blank for a colored placeholder">
          <div className="relative">
            <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="url"
              value={form.banner_image}
              onChange={(e) => update('banner_image', e.target.value)}
              placeholder="https://example.com/image.jpg"
              className={`input pl-10 ${errors.banner_image ? 'border-rose-300 focus:ring-rose-100' : ''}`}
            />
          </div>
        </Field>

        {form.banner_image && /^https?:\/\/.+/.test(form.banner_image) && (
          <div className="rounded-xl overflow-hidden bg-slate-100 h-40">
            <img
              src={form.banner_image}
              alt="Banner preview"
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {isEdit ? 'Updating...' : 'Creating...'}</>
            ) : (
              <>{isEdit ? <Save className="w-4 h-4" /> : <CalendarPlus className="w-4 h-4" />} {isEdit ? 'Update Event' : 'Create Event'}</>
            )}
          </button>
          <button type="button" onClick={() => window.history.back()} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
