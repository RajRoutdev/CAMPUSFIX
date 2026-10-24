'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Building,
  MapPin,
  Layers,
  Users,
  FileSpreadsheet,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Edit2,
  ArrowRight,
  Shield,
  KeyRound,
  Check,
  X,
  Upload,
  Info,
  ChevronRight,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type {
  College,
  Building as BuildingModel,
  Location,
  Department,
  Profile,
  StaffInvitation,
  LocationType,
} from '@/types/models';

type TabType = 'college' | 'buildings' | 'locations' | 'departments' | 'staff' | 'import';

export default function AdminCampusManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('college');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Data States
  const [college, setCollege] = useState<College | null>(null);
  const [buildings, setBuildings] = useState<BuildingModel[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffList, setStaffList] = useState<(Profile & { departmentName?: string })[]>([]);
  const [invitations, setInvitations] = useState<StaffInvitation[]>([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modal / Form States
  const [isCollegeEditing, setIsCollegeEditing] = useState(false);
  const [collegeForm, setCollegeForm] = useState({
    name: '',
    campus_name: '',
    address: '',
    city: '',
    state: '',
  });

  const [buildingModalOpen, setBuildingModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<BuildingModel | null>(null);
  const [buildingForm, setBuildingForm] = useState({ name: '', code: '', total_floors: 1 });

  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationForm, setLocationForm] = useState({
    building_id: '',
    building: '',
    floor: 'Ground Floor',
    room: '',
    area: '',
    location_type: 'classroom' as LocationType,
  });

  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    description: '',
    categories: '',
    default_routing_rule: '',
  });

  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    department_id: '',
    designation: 'Field Technician',
    service_areas: '',
    expires_in_days: 7,
  });
  const [createdInvitation, setCreatedInvitation] = useState<StaffInvitation | null>(null);

  // Bulk Import States
  const [importType, setImportType] = useState<'buildings' | 'locations' | 'departments'>('locations');
  const [csvContent, setCsvContent] = useState('');
  const [importing, setImporting] = useState(false);
  const [previewResult, setPreviewResult] = useState<any | null>(null);

  // Fetch all campus data
  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [colRes, bldRes, locRes, depRes, stfRes] = await Promise.all([
        fetch('/api/campus/college'),
        fetch('/api/campus/buildings?include_inactive=true'),
        fetch('/api/campus/locations?include_inactive=true'),
        fetch('/api/campus/departments?include_inactive=true'),
        fetch('/api/campus/staff'),
      ]);

      if (colRes.ok) {
        const d = await colRes.json();
        setCollege(d.college);
        setCollegeForm({
          name: d.college?.name || '',
          campus_name: d.college?.campus_name || '',
          address: d.college?.address || '',
          city: d.college?.city || '',
          state: d.college?.state || '',
        });
      }
      if (bldRes.ok) {
        const d = await bldRes.json();
        setBuildings(d.buildings || []);
      }
      if (locRes.ok) {
        const d = await locRes.json();
        setLocations(d.locations || []);
      }
      if (depRes.ok) {
        const d = await depRes.json();
        setDepartments(d.departments || []);
      }
      if (stfRes.ok) {
        const d = await stfRes.json();
        setStaffList(d.staff || []);
        setInvitations(d.invitations || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load campus configuration data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  // --------------------------------------------------------------------------
  // FEATURE 1: College Actions
  // --------------------------------------------------------------------------
  const handleUpdateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      const res = await fetch('/api/campus/college', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collegeForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update college details');
      setCollege(data.college);
      setIsCollegeEditing(false);
      setSuccessMessage('College and campus profile updated successfully.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating college');
    }
  };

  // --------------------------------------------------------------------------
  // FEATURE 2: Building Actions
  // --------------------------------------------------------------------------
  const handleSaveBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      const url = '/api/campus/buildings';
      const method = editingBuilding ? 'PATCH' : 'POST';
      const payload = editingBuilding
        ? { id: editingBuilding.id, ...buildingForm }
        : buildingForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save building');

      setBuildingModalOpen(false);
      setEditingBuilding(null);
      setBuildingForm({ name: '', code: '', total_floors: 1 });
      setSuccessMessage(editingBuilding ? 'Building updated.' : 'Building created successfully.');
      loadAllData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving building');
    }
  };

  const handleToggleBuildingStatus = async (bld: BuildingModel) => {
    clearMessages();
    try {
      const res = await fetch('/api/campus/buildings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bld.id, is_active: !bld.is_active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle building status');
      setSuccessMessage(`Building "${bld.name}" status changed to ${!bld.is_active ? 'Active' : 'Inactive'}.`);
      loadAllData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error toggling building status');
    }
  };

  // --------------------------------------------------------------------------
  // FEATURE 3: Location Actions
  // --------------------------------------------------------------------------
  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      const url = '/api/campus/locations';
      const method = editingLocation ? 'PATCH' : 'POST';
      const payload = editingLocation
        ? { id: editingLocation.id, ...locationForm }
        : locationForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save location');

      setLocationModalOpen(false);
      setEditingLocation(null);
      setLocationForm({
        building_id: '',
        building: '',
        floor: 'Ground Floor',
        room: '',
        area: '',
        location_type: 'classroom',
      });
      setSuccessMessage(editingLocation ? 'Location updated.' : 'Location created successfully.');
      loadAllData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving location');
    }
  };

  const handleToggleLocationStatus = async (loc: Location) => {
    clearMessages();
    try {
      const res = await fetch('/api/campus/locations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: loc.id, is_active: loc.is_active === false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle location status');
      setSuccessMessage(`Location "${loc.room}" status toggled.`);
      loadAllData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error toggling location');
    }
  };

  // --------------------------------------------------------------------------
  // FEATURE 4: Department Actions
  // --------------------------------------------------------------------------
  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      const url = '/api/campus/departments';
      const method = editingDepartment ? 'PATCH' : 'POST';
      const categoriesArray = departmentForm.categories
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const payload = {
        name: departmentForm.name,
        description: departmentForm.description,
        categories: categoriesArray,
        default_routing_rule: departmentForm.default_routing_rule,
        ...(editingDepartment ? { id: editingDepartment.id } : {}),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save department');

      setDepartmentModalOpen(false);
      setEditingDepartment(null);
      setDepartmentForm({ name: '', description: '', categories: '', default_routing_rule: '' });
      setSuccessMessage(editingDepartment ? 'Department updated.' : 'Department added successfully.');
      loadAllData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving department');
    }
  };

  const handleToggleDepartmentStatus = async (dept: Department) => {
    clearMessages();
    try {
      const res = await fetch('/api/campus/departments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dept.id, is_active: dept.is_active === false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle department status');
      setSuccessMessage(`Department "${dept.name}" status toggled.`);
      loadAllData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error toggling department');
    }
  };

  // --------------------------------------------------------------------------
  // FEATURE 5: Staff Management Actions
  // --------------------------------------------------------------------------
  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      const res = await fetch('/api/campus/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...staffForm,
          service_areas: staffForm.service_areas
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to issue staff invitation');

      setCreatedInvitation(data.invitation);
      setSuccessMessage(`Invitation issued! Access Code: ${data.invitation.access_code}`);
      setStaffForm({
        name: '',
        email: '',
        department_id: '',
        designation: 'Field Technician',
        service_areas: '',
        expires_in_days: 7,
      });
      loadAllData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inviting staff');
    }
  };

  const handleToggleStaffStatus = async (staffMember: Profile) => {
    clearMessages();
    try {
      const res = await fetch('/api/campus/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: staffMember.id,
          is_active: staffMember.is_active === false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle staff status');
      setSuccessMessage(data.message || 'Staff status updated.');
      loadAllData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error toggling staff access');
    }
  };

  // --------------------------------------------------------------------------
  // FEATURE 6: Bulk Import Actions
  // --------------------------------------------------------------------------
  const handleDryRunPreview = async () => {
    if (!csvContent.trim()) {
      setError('Please provide CSV data to preview.');
      return;
    }
    clearMessages();
    setImporting(true);
    try {
      const res = await fetch('/api/campus/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: importType,
          csvData: csvContent,
          dryRun: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Validation failed');
      setPreviewResult(data);
      setSuccessMessage(
        `Preview ready: ${data.summary.validCount} valid row(s), ${data.summary.errorCount} row error(s), ${data.summary.duplicatesDetected} duplicate(s) flagged.`
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Validation error');
    } finally {
      setImporting(false);
    }
  };

  const handleCommitImport = async () => {
    if (!csvContent.trim()) return;
    clearMessages();
    setImporting(true);
    try {
      const res = await fetch('/api/campus/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: importType,
          csvData: csvContent,
          dryRun: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setSuccessMessage(data.message || `Successfully imported records.`);
      setCsvContent('');
      setPreviewResult(null);
      loadAllData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Commit error');
    } finally {
      setImporting(false);
    }
  };

  // Sample CSV Templates
  const getSampleCsv = () => {
    if (importType === 'buildings') {
      return `name,code,total_floors\nBlock C (Innovation Labs),BLK-C,4\nCentral Research Complex,RES-CTR,5`;
    }
    if (importType === 'locations') {
      return `building_code,floor,room,area,type\nBLK-B,Floor 3,Seminar Hall 301,West Wing,auditorium\nBLK-A,Floor 1,Electronics Lab 105,East Corridor,lab\nOUTDOOR,Ground,Cricket Ground Pavilion,East Side,outdoor`;
    }
    return `name,description,categories,default_routing_rule\nHVAC Services,Air conditioning and ventilation,HVAC;Air Conditioning,Direct to central AC technicians\nCarpentry & Furniture,Woodwork and seating,Furniture;Desks,Route to campus carpentry team`;
  };

  // Location filter view
  const filteredLocations = locations.filter((loc) => {
    const matchesSearch =
      loc.building.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.floor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (loc.area && loc.area.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesBuilding = buildingFilter === 'ALL' || loc.building === buildingFilter;
    const matchesType = typeFilter === 'ALL' || loc.location_type === typeFilter;

    return matchesSearch && matchesBuilding && matchesType;
  });

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Building2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Campus Facilities & Data Hub
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage multi-tier campus hierarchy, college profile, department routing rules, and staff rosters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAllData}
            disabled={loading}
            className="text-xs h-9 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Link href="/admin/dashboard">
            <Button size="sm" variant="ghost" className="text-xs h-9">
              Admin Overview &rarr;
            </Button>
          </Link>
        </div>
      </div>

      {/* Alert Banners */}
      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-700 hover:text-rose-900 text-xs font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Overview Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">College</div>
          <div className="text-sm font-bold text-slate-900 truncate mt-0.5">
            {college?.name || 'Loading...'}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            {college?.city || 'Bengaluru'}
          </div>
        </div>

        <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Buildings / Blocks</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{buildings.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {buildings.filter((b) => b.is_active).length} active facilities
          </div>
        </div>

        <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Floors & Rooms</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{locations.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {locations.filter((l) => l.is_active !== false).length} active locations
          </div>
        </div>

        <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Departments</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{departments.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {departments.filter((d) => d.is_active !== false).length} active routing units
          </div>
        </div>

        <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Staff & Techs</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{staffList.length}</div>
          <div className="text-[11px] text-indigo-600 font-medium mt-1">
            {invitations.filter((i) => !i.is_used).length} pending invites
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-1">
        {[
          { id: 'college', label: '1. College Profile', icon: Building2 },
          { id: 'buildings', label: '2. Buildings & Blocks', icon: Building },
          { id: 'locations', label: '3. Multi-Tier Locations', icon: MapPin },
          { id: 'departments', label: '4. Departments & Routing', icon: Layers },
          { id: 'staff', label: '5. Staff Roster & Invites', icon: Users },
          { id: 'import', label: '6. Bulk CSV Import', icon: FileSpreadsheet },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: COLLEGE PROFILE (FEATURE 1)                                   */}
      {/* ==================================================================== */}
      {activeTab === 'college' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 border-slate-200 shadow-2xs">
            <CardHeader className="p-5 border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    College Information
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Tenant details governing this campus management partition.
                  </CardDescription>
                </div>
                {!isCollegeEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsCollegeEditing(true)}
                    className="text-xs h-8 gap-1.5"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {isCollegeEditing ? (
                <form onSubmit={handleUpdateCollege} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs font-semibold text-slate-700">College Name</Label>
                      <Input
                        value={collegeForm.name}
                        onChange={(e) => setCollegeForm({ ...collegeForm, name: e.target.value })}
                        required
                        className="text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs font-semibold text-slate-700">Campus / Branch Name</Label>
                      <Input
                        value={collegeForm.campus_name}
                        onChange={(e) => setCollegeForm({ ...collegeForm, campus_name: e.target.value })}
                        placeholder="e.g., Main Technology Park Campus"
                        className="text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs font-semibold text-slate-700">Campus Address</Label>
                      <Input
                        value={collegeForm.address}
                        onChange={(e) => setCollegeForm({ ...collegeForm, address: e.target.value })}
                        className="text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">City</Label>
                      <Input
                        value={collegeForm.city}
                        onChange={(e) => setCollegeForm({ ...collegeForm, city: e.target.value })}
                        className="text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">State / Region</Label>
                      <Input
                        value={collegeForm.state}
                        onChange={(e) => setCollegeForm({ ...collegeForm, state: e.target.value })}
                        className="text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCollegeEditing(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="text-xs gap-1">
                      Save College Profile
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase">Institution</div>
                      <div className="text-sm font-bold text-slate-900 mt-1">
                        {college?.name || 'Apex Institute of Technology'}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase">Campus Branch</div>
                      <div className="text-sm font-medium text-slate-800 mt-1">
                        {college?.campus_name || 'Main Campus (Technology Park)'}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 sm:col-span-2">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase">Address</div>
                      <div className="text-xs text-slate-700 mt-1">
                        {college?.address || '100 Innovation Boulevard, Tech District'}, {college?.city}, {college?.state}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900">
                    <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      Multi-college tenant boundaries are enforced at the database level using RLS and UUID scoping.
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="p-5 border-b pb-4">
              <CardTitle className="text-sm font-bold text-slate-900">
                Tenant Hierarchy Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                <span className="font-semibold text-slate-800">1. College:</span>
                <p className="text-slate-500 mt-0.5">{college?.name || 'College Instance'}</p>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                <span className="font-semibold text-slate-800">2. Buildings:</span>
                <p className="text-slate-500 mt-0.5">{buildings.length} assigned structures</p>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                <span className="font-semibold text-slate-800">3. Multi-tier Locations:</span>
                <p className="text-slate-500 mt-0.5">{locations.length} rooms, labs, outdoor facilities</p>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                <span className="font-semibold text-slate-800">4. Departments:</span>
                <p className="text-slate-500 mt-0.5">{departments.length} autonomous routing units</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: BUILDINGS & BLOCKS (FEATURE 2)                                */}
      {/* ==================================================================== */}
      {activeTab === 'buildings' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Buildings and Blocks</h2>
              <p className="text-xs text-slate-500">
                Manage campus buildings, unique block codes, and floor counts.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingBuilding(null);
                setBuildingForm({ name: '', code: '', total_floors: 1 });
                setBuildingModalOpen(true);
              }}
              className="text-xs h-9 gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Building
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buildings.map((bld) => {
              const locCount = locations.filter((l) => l.building === bld.name || l.building_id === bld.id).length;
              return (
                <Card
                  key={bld.id}
                  className={`border transition-all shadow-2xs ${
                    bld.is_active ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50/70 opacity-75'
                  }`}
                >
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border">
                            {bld.code}
                          </span>
                          <Badge variant={bld.is_active ? 'default' : 'secondary'} className="text-[10px]">
                            {bld.is_active ? 'Active' : 'Deactivated'}
                          </Badge>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-1.5">{bld.name}</h3>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingBuilding(bld);
                          setBuildingForm({
                            name: bld.name,
                            code: bld.code,
                            total_floors: bld.total_floors || 1,
                          });
                          setBuildingModalOpen(true);
                        }}
                        className="h-7 px-2 text-xs text-slate-500 hover:text-slate-900"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
                      <div className="p-2 rounded bg-slate-50 border border-slate-100">
                        <span className="text-[11px] text-slate-400">Floors</span>
                        <div className="font-semibold text-slate-800">
                          {bld.total_floors === 0 ? 'Outdoor / Grounds' : `${bld.total_floors} Floor(s)`}
                        </div>
                      </div>
                      <div className="p-2 rounded bg-slate-50 border border-slate-100">
                        <span className="text-[11px] text-slate-400">Locations</span>
                        <div className="font-semibold text-slate-800">{locCount} registered</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => {
                          setBuildingFilter(bld.name);
                          setActiveTab('locations');
                        }}
                        className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        View Locations &rarr;
                      </button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleBuildingStatus(bld)}
                        className={`h-7 px-2 text-[11px] ${
                          bld.is_active ? 'text-amber-700 hover:text-amber-900' : 'text-emerald-700 hover:text-emerald-900'
                        }`}
                      >
                        {bld.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Add/Edit Building Modal */}
          {buildingModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <Card className="w-full max-w-md border-slate-200 shadow-xl bg-white">
                <CardHeader className="p-5 border-b pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold text-slate-900">
                      {editingBuilding ? 'Edit Building' : 'Add New Building'}
                    </CardTitle>
                    <button
                      onClick={() => setBuildingModalOpen(false)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </CardHeader>
                <form onSubmit={handleSaveBuilding}>
                  <CardContent className="p-5 space-y-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Building / Facility Name</Label>
                      <Input
                        value={buildingForm.name}
                        onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                        placeholder="e.g., Block B (Academic & Library)"
                        required
                        className="text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Unique Code</Label>
                      <Input
                        value={buildingForm.code}
                        onChange={(e) => setBuildingForm({ ...buildingForm, code: e.target.value })}
                        placeholder="e.g., BLK-B"
                        required
                        className="text-xs h-9 font-mono uppercase"
                      />
                      <p className="text-[11px] text-slate-400">Unique identifier within college partition.</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Total Floors</Label>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        value={buildingForm.total_floors}
                        onChange={(e) => setBuildingForm({ ...buildingForm, total_floors: parseInt(e.target.value, 10) || 0 })}
                        required
                        className="text-xs h-9"
                      />
                      <p className="text-[11px] text-slate-400">Set 0 for outdoor or ground-level open areas.</p>
                    </div>
                  </CardContent>
                  <div className="flex items-center justify-end gap-2 p-4 border-t bg-slate-50">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setBuildingModalOpen(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="text-xs">
                      {editingBuilding ? 'Save Changes' : 'Create Building'}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: FLOORS, ROOMS & AREAS (FEATURE 3)                             */}
      {/* ==================================================================== */}
      {activeTab === 'locations' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Campus Locations</h2>
              <p className="text-xs text-slate-500">
                Multi-tier hierarchy: College &rarr; Building &rarr; Floor &rarr; Room / Area (Supports outdoor areas without room numbers).
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingLocation(null);
                const defaultBld = buildings[0]?.name || 'Block B (Academic & Library)';
                const defaultBldId = buildings[0]?.id || '';
                setLocationForm({
                  building_id: defaultBldId,
                  building: defaultBld,
                  floor: 'Ground Floor',
                  room: '',
                  area: '',
                  location_type: 'classroom',
                });
                setLocationModalOpen(true);
              }}
              className="text-xs h-9 gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Location
            </Button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <Input
                placeholder="Search by room, area, floor, or building..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-8"
              />
            </div>
            <select
              aria-label="Filter locations by building"
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-2xs"
            >
              <option value="ALL">All Buildings ({locations.length})</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
            <select
              aria-label="Filter locations by type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-2xs"
            >
              <option value="ALL">All Types</option>
              {['classroom', 'lab', 'office', 'library', 'toilet', 'corridor', 'staircase', 'lift', 'parking', 'outdoor', 'other'].map((t) => (
                <option key={t} value={t}>{t.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Location Records Table */}
          <Card className="border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b text-[11px] font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Building / Block</th>
                    <th className="px-4 py-3">Floor / Level</th>
                    <th className="px-4 py-3">Room / Facility Area</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLocations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No locations match the specified criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLocations.map((loc) => (
                      <tr key={loc.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{loc.building}</td>
                        <td className="px-4 py-3 text-slate-600">{loc.floor}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-900">{loc.room}</span>
                          {loc.area && <span className="text-slate-400 ml-1.5">({loc.area})</span>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {loc.location_type || 'General'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={loc.is_active !== false ? 'default' : 'secondary'} className="text-[10px]">
                            {loc.is_active !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingLocation(loc);
                              setLocationForm({
                                building_id: loc.building_id || '',
                                building: loc.building,
                                floor: loc.floor,
                                room: loc.room,
                                area: loc.area || '',
                                location_type: loc.location_type || 'classroom',
                              });
                              setLocationModalOpen(true);
                            }}
                            className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleLocationStatus(loc)}
                            className={`h-7 px-2 text-[11px] ${
                              loc.is_active !== false ? 'text-amber-700 hover:text-amber-900' : 'text-emerald-700 hover:text-emerald-900'
                            }`}
                          >
                            {loc.is_active !== false ? 'Deactivate' : 'Activate'}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Add/Edit Location Modal */}
          {locationModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <Card className="w-full max-w-md border-slate-200 shadow-xl bg-white">
                <CardHeader className="p-5 border-b pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold text-slate-900">
                      {editingLocation ? 'Edit Campus Location' : 'Add New Location'}
                    </CardTitle>
                    <button
                      onClick={() => setLocationModalOpen(false)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </CardHeader>
                <form onSubmit={handleSaveLocation}>
                  <CardContent className="p-5 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">1. Building / Block</Label>
                      <select
                        aria-label="Select building for location"
                        value={locationForm.building}
                        onChange={(e) => {
                          const chosen = buildings.find((b) => b.name === e.target.value);
                          setLocationForm({
                            ...locationForm,
                            building: e.target.value,
                            building_id: chosen?.id || '',
                          });
                        }}
                        required
                        className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs shadow-2xs"
                      >
                        {buildings.map((b) => (
                          <option key={b.id} value={b.name}>{b.name} ({b.code})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">2. Floor / Level</Label>
                      <Input
                        value={locationForm.floor}
                        onChange={(e) => setLocationForm({ ...locationForm, floor: e.target.value })}
                        placeholder="e.g., Ground Floor, Floor 2, Outdoor"
                        required
                        className="text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">3. Room Number / Facility Area</Label>
                      <Input
                        value={locationForm.room}
                        onChange={(e) => setLocationForm({ ...locationForm, room: e.target.value })}
                        placeholder="e.g., Room B-204, East Restroom, Cricket Pavilion"
                        required
                        className="text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Specific Area (Optional)</Label>
                      <Input
                        value={locationForm.area}
                        onChange={(e) => setLocationForm({ ...locationForm, area: e.target.value })}
                        placeholder="e.g., East Wing, Back Gate, Podium Area"
                        className="text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Facility Type</Label>
                      <select
                        aria-label="Select facility type"
                        value={locationForm.location_type}
                        onChange={(e) => setLocationForm({ ...locationForm, location_type: e.target.value as LocationType })}
                        className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs shadow-2xs"
                      >
                        {['classroom', 'lab', 'office', 'library', 'toilet', 'corridor', 'staircase', 'lift', 'parking', 'outdoor', 'other'].map((t) => (
                          <option key={t} value={t}>{t.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                  </CardContent>
                  <div className="flex items-center justify-end gap-2 p-4 border-t bg-slate-50">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocationModalOpen(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="text-xs">
                      {editingLocation ? 'Save Changes' : 'Create Location'}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: DEPARTMENTS & ROUTING RULES (FEATURE 4)                       */}
      {/* ==================================================================== */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Departments & Routing Rules</h2>
              <p className="text-xs text-slate-500">
                Configure handled issue categories and automated dispatch routing rules.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingDepartment(null);
                setDepartmentForm({ name: '', description: '', categories: '', default_routing_rule: '' });
                setDepartmentModalOpen(true);
              }}
              className="text-xs h-9 gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Department
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.map((dept) => {
              const assignedStaff = staffList.filter((s) => s.department_id === dept.id);
              return (
                <Card key={dept.id} className="border-slate-200 bg-white shadow-2xs">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-slate-900">{dept.name}</h3>
                          <Badge variant={dept.is_active !== false ? 'default' : 'secondary'} className="text-[10px]">
                            {dept.is_active !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{dept.description || 'No description provided'}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingDepartment(dept);
                          setDepartmentForm({
                            name: dept.name,
                            description: dept.description || '',
                            categories: (dept.categories || []).join(', '),
                            default_routing_rule: dept.default_routing_rule || '',
                          });
                          setDepartmentModalOpen(true);
                        }}
                        className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t text-xs">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase">Handled Categories</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(dept.categories && dept.categories.length > 0) ? (
                          dept.categories.map((c) => (
                            <Badge key={c} variant="outline" className="text-[10px] bg-slate-50">
                              {c}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-slate-400 text-[11px]">No specific categories assigned</span>
                        )}
                      </div>
                    </div>

                    {dept.default_routing_rule && (
                      <div className="p-2.5 rounded bg-blue-50/60 border border-blue-100 text-xs text-blue-900">
                        <span className="font-semibold">Routing Rule:</span> {dept.default_routing_rule}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t text-xs text-slate-500">
                      <span>Assigned Staff: <strong className="text-slate-900">{assignedStaff.length}</strong> technician(s)</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleDepartmentStatus(dept)}
                        className={`h-7 px-2 text-[11px] ${
                          dept.is_active !== false ? 'text-amber-700 hover:text-amber-900' : 'text-emerald-700 hover:text-emerald-900'
                        }`}
                      >
                        {dept.is_active !== false ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Add/Edit Department Modal */}
          {departmentModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <Card className="w-full max-w-md border-slate-200 shadow-xl bg-white">
                <CardHeader className="p-5 border-b pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold text-slate-900">
                      {editingDepartment ? 'Edit Department' : 'Add Department'}
                    </CardTitle>
                    <button
                      onClick={() => setDepartmentModalOpen(false)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </CardHeader>
                <form onSubmit={handleSaveDepartment}>
                  <CardContent className="p-5 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Department Name</Label>
                      <Input
                        value={departmentForm.name}
                        onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                        placeholder="e.g., Electrical, Plumbing, IT Support"
                        required
                        className="text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Description</Label>
                      <Textarea
                        value={departmentForm.description}
                        onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })}
                        placeholder="Scope of work and responsibilities..."
                        rows={2}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Handled Categories (comma-separated)</Label>
                      <Input
                        value={departmentForm.categories}
                        onChange={(e) => setDepartmentForm({ ...departmentForm, categories: e.target.value })}
                        placeholder="e.g., Electrical, Lighting, Power Outage"
                        className="text-xs h-9"
                      />
                      <p className="text-[11px] text-slate-400">Incoming tickets with these categories auto-route here.</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Default Dispatch Rule</Label>
                      <Input
                        value={departmentForm.default_routing_rule}
                        onChange={(e) => setDepartmentForm({ ...departmentForm, default_routing_rule: e.target.value })}
                        placeholder="e.g., Auto-route urgent electrical defects to on-duty team"
                        className="text-xs h-9"
                      />
                    </div>
                  </CardContent>
                  <div className="flex items-center justify-end gap-2 p-4 border-t bg-slate-50">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDepartmentModalOpen(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="text-xs">
                      {editingDepartment ? 'Save Changes' : 'Create Department'}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: STAFF MANAGEMENT & INVITATIONS (FEATURE 5)                     */}
      {/* ==================================================================== */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Staff Roster & Access Codes</h2>
              <p className="text-xs text-slate-500">
                Securely onboard maintenance staff using individually issued, expiring access codes.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setCreatedInvitation(null);
                setStaffModalOpen(true);
              }}
              className="text-xs h-9 gap-1.5"
            >
              <KeyRound className="w-4 h-4" />
              Invite Staff Member
            </Button>
          </div>

          {/* Active Invitations Callout */}
          {invitations.length > 0 && (
            <Card className="border-indigo-200 bg-indigo-50/40 shadow-2xs">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 uppercase">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  Active Staff Invitations ({invitations.filter((i) => !i.is_used).length} pending)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3 rounded-lg bg-white border border-indigo-100 shadow-2xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {inv.access_code}
                          </span>
                          <Badge variant={inv.is_used ? 'secondary' : 'default'} className="text-[10px]">
                            {inv.is_used ? 'Redeemed' : 'Pending'}
                          </Badge>
                        </div>
                        <div className="text-xs font-bold text-slate-900 mt-2">{inv.name}</div>
                        <div className="text-[11px] text-slate-500">{inv.email}</div>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-2 pt-1.5 border-t">
                        Expires: {new Date(inv.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Staff Roster Table */}
          <Card className="border-slate-200 shadow-2xs overflow-hidden">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-sm font-bold text-slate-900">
                Current Maintenance Staff Roster
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b text-[11px] font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Staff Member</th>
                    <th className="px-4 py-3">Email Address</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Designation</th>
                    <th className="px-4 py-3">Access Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffList.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{member.name}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">{member.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px]">
                          {member.departmentName || 'General Maintenance'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{member.designation || 'Technician'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={member.is_active !== false ? 'default' : 'secondary'} className="text-[10px]">
                          {member.is_active !== false ? 'Active' : 'Suspended'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleStaffStatus(member)}
                          className={`h-7 px-2 text-[11px] ${
                            member.is_active !== false ? 'text-amber-700 hover:text-amber-900' : 'text-emerald-700 hover:text-emerald-900'
                          }`}
                        >
                          {member.is_active !== false ? 'Suspend Access' : 'Activate Access'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Invite Staff Modal */}
          {staffModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <Card className="w-full max-w-md border-slate-200 shadow-xl bg-white">
                <CardHeader className="p-5 border-b pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold text-slate-900">
                      Invite Maintenance Staff
                    </CardTitle>
                    <button
                      onClick={() => setStaffModalOpen(false)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </CardHeader>
                <form onSubmit={handleInviteStaff}>
                  <CardContent className="p-5 space-y-3">
                    {createdInvitation ? (
                      <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 space-y-2 text-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                        <h4 className="text-xs font-bold text-emerald-900">Invitation Generated!</h4>
                        <p className="text-[11px] text-emerald-700">
                          Provide this secure access code to <strong>{createdInvitation.name}</strong> for Staff Portal onboarding:
                        </p>
                        <div className="p-2.5 bg-white rounded border border-emerald-300 font-mono text-base font-bold text-emerald-900 select-all">
                          {createdInvitation.access_code}
                        </div>
                        <p className="text-[10px] text-emerald-600">Valid for 7 days. Role = staff enforced.</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-slate-700">Staff Member Full Name</Label>
                          <Input
                            value={staffForm.name}
                            onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                            placeholder="e.g., Rajesh Kumar"
                            required
                            className="text-xs h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-slate-700">Staff Email Address</Label>
                          <Input
                            type="email"
                            value={staffForm.email}
                            onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                            placeholder="e.g., rajesh.kumar@apex.edu"
                            required
                            className="text-xs h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-slate-700">Assigned Department</Label>
                          <select
                            aria-label="Select staff department"
                            value={staffForm.department_id}
                            onChange={(e) => setStaffForm({ ...staffForm, department_id: e.target.value })}
                            className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs shadow-2xs"
                          >
                            <option value="">General Maintenance</option>
                            {departments.map((d) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-slate-700">Designation / Role Title</Label>
                          <Input
                            value={staffForm.designation}
                            onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })}
                            placeholder="e.g., Senior Electrician, Lab In-charge"
                            className="text-xs h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-slate-700">Assigned Service Areas (comma-separated)</Label>
                          <Input
                            value={staffForm.service_areas}
                            onChange={(e) => setStaffForm({ ...staffForm, service_areas: e.target.value })}
                            placeholder="e.g., Block B, Block A, Central Quad"
                            className="text-xs h-9"
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                  <div className="flex items-center justify-end gap-2 p-4 border-t bg-slate-50">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setStaffModalOpen(false)}
                      className="text-xs"
                    >
                      Close
                    </Button>
                    {!createdInvitation && (
                      <Button type="submit" size="sm" className="text-xs gap-1">
                        Generate Access Code
                      </Button>
                    )}
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: BULK CSV IMPORT (FEATURE 6)                                  */}
      {/* ==================================================================== */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Bulk Data Import via CSV</h2>
            <p className="text-xs text-slate-500">
              Bulk-upload Buildings, Multi-Tier Locations, or Departments with automatic column validation, duplicate detection, and row-level verification.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Input & Target Select */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-slate-200 shadow-2xs">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-900">
                      Step 1: Select Target & Paste CSV Data
                    </CardTitle>
                    <select
                      aria-label="Select CSV import target"
                      value={importType}
                      onChange={(e) => {
                        setImportType(e.target.value as any);
                        setPreviewResult(null);
                      }}
                      className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-800 shadow-2xs"
                    >
                      <option value="locations">Locations & Rooms</option>
                      <option value="buildings">Buildings & Blocks</option>
                      <option value="departments">Departments & Routing</option>
                    </select>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-slate-700">CSV Contents</Label>
                      <button
                        type="button"
                        onClick={() => setCsvContent(getSampleCsv())}
                        className="text-[11px] font-semibold text-indigo-600 hover:underline"
                      >
                        Load Sample CSV
                      </button>
                    </div>
                    <Textarea
                      value={csvContent}
                      onChange={(e) => {
                        setCsvContent(e.target.value);
                        setPreviewResult(null);
                      }}
                      placeholder="Paste comma-separated records with header row..."
                      rows={8}
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDryRunPreview}
                      disabled={importing || !csvContent.trim()}
                      className="text-xs gap-1.5 h-9"
                    >
                      {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      Validate & Preview Records
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCommitImport}
                      disabled={importing || !previewResult || previewResult.summary?.validCount === 0}
                      className="text-xs gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Commit Import ({previewResult?.summary?.validCount || 0} valid records)
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Preview Results */}
              {previewResult && (
                <Card className="border-slate-200 shadow-2xs">
                  <CardHeader className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold text-slate-900">
                        Step 2: Validation Results & Dry-Run Preview
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[11px] bg-emerald-50 text-emerald-800 border-emerald-200">
                          {previewResult.summary.validCount} Valid
                        </Badge>
                        <Badge variant="outline" className="text-[11px] bg-rose-50 text-rose-800 border-rose-200">
                          {previewResult.summary.errorCount} Errors
                        </Badge>
                        <Badge variant="outline" className="text-[11px] bg-amber-50 text-amber-800 border-amber-200">
                          {previewResult.summary.duplicatesDetected} Duplicates
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {/* Error rows breakdown */}
                    {previewResult.errorRows.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Rejected Row Errors ({previewResult.errorRows.length})
                        </h4>
                        <div className="max-h-40 overflow-y-auto rounded border border-rose-200 bg-rose-50/50 p-2 space-y-1 text-xs">
                          {previewResult.errorRows.map((errRow: any, idx: number) => (
                            <div key={idx} className="text-rose-900 text-[11px]">
                              <strong>Row {errRow.rowNumber}:</strong> {errRow.error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Valid rows preview */}
                    {previewResult.validRows.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Ready for Insertion ({previewResult.validRows.length})
                        </h4>
                        <div className="max-h-52 overflow-y-auto rounded border border-slate-200 text-xs">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b text-[10px] text-slate-500 uppercase">
                              <tr>
                                {Object.keys(previewResult.validRows[0]).filter((k) => k !== 'college_id').map((k) => (
                                  <th key={k} className="px-3 py-1.5">{k}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {previewResult.validRows.slice(0, 10).map((row: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-50">
                                  {Object.keys(row).filter((k) => k !== 'college_id').map((k) => (
                                    <td key={k} className="px-3 py-1.5 font-mono text-[11px] text-slate-700">
                                      {Array.isArray(row[k]) ? row[k].join(', ') : String(row[k] ?? '')}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: CSV Format Rules & Security */}
            <div className="space-y-4">
              <Card className="border-slate-200 shadow-2xs">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase">
                    <Info className="w-3.5 h-3.5 text-indigo-600" />
                    CSV Format Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-1 space-y-3 text-xs text-slate-600">
                  <div>
                    <strong className="text-slate-800">Buildings Header:</strong>
                    <p className="font-mono text-[11px] bg-slate-50 p-1.5 rounded mt-0.5 border">
                      name,code,total_floors
                    </p>
                  </div>
                  <div>
                    <strong className="text-slate-800">Locations Header:</strong>
                    <p className="font-mono text-[11px] bg-slate-50 p-1.5 rounded mt-0.5 border">
                      building_code,floor,room,area,type
                    </p>
                  </div>
                  <div>
                    <strong className="text-slate-800">Departments Header:</strong>
                    <p className="font-mono text-[11px] bg-slate-50 p-1.5 rounded mt-0.5 border">
                      name,description,categories,default_routing_rule
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                    <strong>Security Rule:</strong> Bulk CSV import never accepts authentication passwords or credentials. Staff access requires individually issued access tokens.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
