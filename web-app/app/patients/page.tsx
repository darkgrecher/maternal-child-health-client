/**
 * Patients Page
 * 
 * Consolidated view of all patients (pregnant mothers and children)
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, differenceInMonths, differenceInYears, differenceInWeeks } from 'date-fns';
import {
  Users,
  Search,
  Heart,
  Baby,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  ChevronRight,
  UserPlus,
  FileText,
} from 'lucide-react';
import { MainLayout, Header } from '../components/main-layout';
import {
  Card,
  Button,
  Badge,
  Avatar,
  SectionTitle,
  Input,
  Select,
  Modal,
  EmptyState,
  Alert,
} from '../components/ui';
import { useChildStore, usePregnancyStore } from '../lib/stores';
import type { ChildProfile, PregnancyProfile } from '../lib/types';

type PregnancyFilter = 'all' | 'active' | 'high_risk';

const getAge = (dob?: string) => {
  if (!dob) return 'Unknown';
  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  const years = differenceInYears(new Date(), date);
  return `${years} years`;
};

const getChildAge = (dob?: string) => {
  if (!dob) return 'Unknown';
  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  const months = differenceInMonths(new Date(), date);
  if (months < 12) {
    return `${months} month${months !== 1 ? 's' : ''}`;
  }
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return remainingMonths > 0 
    ? `${years}y ${remainingMonths}m` 
    : `${years} year${years !== 1 ? 's' : ''}`;
};

const getPregnancyWeek = (edd?: string) => {
  if (!edd) return null;
  const dueDate = new Date(edd);
  if (Number.isNaN(dueDate.getTime())) return null;
  const today = new Date();
  const weeksRemaining = differenceInWeeks(dueDate, today);
  return 40 - weeksRemaining;
};

type PatientView = 'all' | 'mothers' | 'children';

export default function PatientsPage() {
  const router = useRouter();
  const {
    pregnancies,
    isLoading: pregnanciesLoading,
    error: pregnanciesError,
    fetchPregnancies,
  } = usePregnancyStore();
  const {
    children,
    isLoading: childrenLoading,
    error: childrenError,
    fetchChildren,
  } = useChildStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<PregnancyFilter>('all');
  const [view, setView] = useState<PatientView>('all');
  const [selectedMother, setSelectedMother] = useState<PregnancyProfile | null>(null);
  const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);

  useEffect(() => {
    fetchPregnancies();
    fetchChildren();
  }, [fetchPregnancies, fetchChildren]);

  const getMotherName = (pregnancy: PregnancyProfile) =>
    pregnancy.motherFullName || `${pregnancy.motherFirstName} ${pregnancy.motherLastName}`.trim();

  const childrenByMother = useMemo(() => {
    const map = new Map<string, ChildProfile[]>();
    children.forEach((child) => {
      const motherName = child.motherName?.trim();
      if (!motherName) return;
      const existing = map.get(motherName) ?? [];
      existing.push(child);
      map.set(motherName, existing);
    });
    return map;
  }, [children]);

  const handleCall = (phone?: string | null) => {
    if (!phone) return;
    const digits = phone.replace(/\D+/g, '');
    if (!digits) return;
    window.open(`tel:${digits}`, '_self');
  };

  const filteredPregnancies = useMemo(() => {
    return pregnancies.filter((pregnancy) => {
      const motherName = getMotherName(pregnancy).toLowerCase();
      const contactPhone = pregnancy.emergencyContactPhone || '';
      const matchesSearch = motherName.includes(searchTerm.toLowerCase()) ||
        contactPhone.includes(searchTerm);
      const matchesStatus = filterStatus === 'all'
        || (filterStatus === 'active' && pregnancy.status === 'active')
        || (filterStatus === 'high_risk' && pregnancy.isHighRisk);
      return matchesSearch && matchesStatus;
    });
  }, [pregnancies, searchTerm, filterStatus]);

  const filteredChildren = useMemo(() => {
    return children.filter((child) => {
      const childName = `${child.firstName} ${child.lastName}`.trim().toLowerCase();
      const motherName = (child.motherName ?? '').toLowerCase();
      const matchesSearch = childName.includes(searchTerm.toLowerCase()) ||
        motherName.includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [children, searchTerm]);

  // Stats
  const totalMothers = pregnancies.length;
  const activePregnancies = pregnancies.filter((pregnancy) => pregnancy.status === 'active').length;
  const totalChildren = children.length;
  const highRiskPatients = pregnancies.filter((pregnancy) => pregnancy.isHighRisk).length;
  const errorMessage = pregnanciesError || childrenError || '';
  const isLoading = pregnanciesLoading || childrenLoading;

  return (
    <MainLayout>
      <Header
        title="Patients"
        subtitle="Manage mothers and children"
        actions={
          <Button icon={UserPlus} onClick={() => setShowNewPatientModal(true)}>
            New Patient
          </Button>
        }
      />

      {errorMessage && (
        <Alert variant="warning" title="Unable to load patients" icon={AlertCircle} className="mt-4">
          {errorMessage}
        </Alert>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-purple-100">
            <Users className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalMothers}</p>
            <p className="text-sm text-slate-500">Total Mothers</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-pink-100">
            <Heart className="w-6 h-6 text-pink-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{activePregnancies}</p>
            <p className="text-sm text-slate-500">Active Pregnancies</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-blue-100">
            <Baby className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalChildren}</p>
            <p className="text-sm text-slate-500">Children</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-amber-100">
            <AlertCircle className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{highRiskPatients}</p>
            <p className="text-sm text-slate-500">High Risk</p>
          </div>
        </Card>
      </div>

      {/* View Toggle & Filters */}
      <Card className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* View Toggle */}
          <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'all'
                  ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              onClick={() => setView('all')}
            >
              All Patients
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'mothers'
                  ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              onClick={() => setView('mothers')}
            >
              Mothers
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'children'
                  ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              onClick={() => setView('children')}
            >
              Children
            </button>
          </div>

          <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <Input
                placeholder="Search by name or phone..."
                icon={Search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {view !== 'children' && (
              <Select
                options={[
                  { value: 'all', label: 'All Pregnancies' },
                  { value: 'active', label: 'Active Pregnancies' },
                  { value: 'high_risk', label: 'High Risk' },
                ]}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as PregnancyFilter)}
                className="w-full sm:w-52"
              />
            )}
          </div>
        </div>
      </Card>

      {/* Patient Lists */}
      {(view === 'all' || view === 'mothers') && (
        <div className="mb-8">
          <SectionTitle title={`Mothers (${filteredPregnancies.length})`} />
          <div className="grid gap-4">
            {filteredPregnancies.map((pregnancy) => {
              const motherName = getMotherName(pregnancy);
              const contactPhone = pregnancy.emergencyContactPhone || pregnancy.obgynContact || '';
              const currentWeek = pregnancy.currentWeek ?? getPregnancyWeek(pregnancy.expectedDeliveryDate);
              const motherChildren = childrenByMother.get(motherName) ?? [];

              return (
                <Card key={pregnancy.id} hover onClick={() => setSelectedMother(pregnancy)}>
                  <div className="flex items-center gap-4">
                    <Avatar name={motherName} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {motherName}
                        </h3>
                        {pregnancy.status === 'active' && (
                          <Badge variant="info">Pregnant</Badge>
                        )}
                        {pregnancy.isHighRisk && (
                          <Badge variant="warning">High Risk</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span>{getAge(pregnancy.motherDateOfBirth)}</span>
                        {contactPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {contactPhone}
                          </span>
                        )}
                        {pregnancy.hospitalName && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {pregnancy.hospitalName}
                          </span>
                        )}
                      </div>
                      {pregnancy.status === 'active' && currentWeek !== null && (
                        <div className="mt-2 flex items-center gap-2">
                          <Heart className="w-4 h-4 text-pink-500" />
                          <span className="text-sm text-pink-600 dark:text-pink-400">
                            Week {currentWeek}
                            {pregnancy.expectedDeliveryDate && (
                              <> • EDD: {format(new Date(pregnancy.expectedDeliveryDate), 'MMM d, yyyy')}</>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {motherChildren.length > 0 && (
                        <div className="flex items-center gap-1 text-slate-500 mb-2">
                          <Baby className="w-4 h-4" />
                          <span className="text-sm">
                            {motherChildren.length} child{motherChildren.length > 1 ? 'ren' : ''}
                          </span>
                        </div>
                      )}
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          {!isLoading && filteredPregnancies.length === 0 && (
            <EmptyState
              icon={Heart}
              title="No mothers found"
              description="Try adjusting your filters or search."
            />
          )}
        </div>
      )}

      {(view === 'all' || view === 'children') && (
        <div>
          <SectionTitle title={`Children (${filteredChildren.length})`} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredChildren.map((child) => {
              const childName = `${child.firstName} ${child.lastName}`.trim();

              return (
                <Card key={child.id} hover onClick={() => setSelectedChild(child)}>
                  <div className="flex items-center gap-4">
                    <Avatar name={childName} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {childName}
                        </h3>
                        <Badge variant={child.gender === 'male' ? 'info' : 'default'}>
                          {child.gender === 'male' ? '♂' : '♀'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">{getChildAge(child.dateOfBirth)}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Mother: {child.motherName || 'Not provided'}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </Card>
              );
            })}
          </div>
          {!isLoading && filteredChildren.length === 0 && (
            <EmptyState
              icon={Baby}
              title="No children found"
              description="Try adjusting your search."
            />
          )}
        </div>
      )}

      {/* Mother Detail Modal */}
      <Modal
        isOpen={!!selectedMother}
        onClose={() => setSelectedMother(null)}
        title="Mother Details"
        size="lg"
      >
        {selectedMother && (() => {
          const motherName = getMotherName(selectedMother);
          const motherChildren = childrenByMother.get(motherName) ?? [];
          const contactPhone = selectedMother.emergencyContactPhone || selectedMother.obgynContact || '';
          const currentWeek = selectedMother.currentWeek ?? getPregnancyWeek(selectedMother.expectedDeliveryDate);

          return (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Avatar name={motherName} size="xl" />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {motherName}
                  </h2>
                  {selectedMother.motherBloodType && (
                    <p className="text-slate-500">Blood Type: {selectedMother.motherBloodType}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedMother.status === 'active' && (
                      <Badge variant="info">Currently Pregnant</Badge>
                    )}
                    {selectedMother.isHighRisk && (
                      <Badge variant="warning">High Risk</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase">Phone</label>
                  {contactPhone ? (
                    <button
                      type="button"
                      className="text-slate-900 dark:text-white hover:text-slate-600"
                      onClick={() => handleCall(contactPhone)}
                    >
                      {contactPhone}
                    </button>
                  ) : (
                    <p className="text-slate-900 dark:text-white">Not provided</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase">Age</label>
                  <p className="text-slate-900 dark:text-white">
                    {getAge(selectedMother.motherDateOfBirth)}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-500 uppercase">Hospital</label>
                  <p className="text-slate-900 dark:text-white">
                    {selectedMother.hospitalName || 'Not provided'}
                  </p>
                </div>
              </div>

              {selectedMother.status === 'active' && (
                <div>
                  <SectionTitle title="Current Pregnancy" />
                  <Card className="bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-slate-500">Current Week</p>
                          <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                            Week {currentWeek ?? '—'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500">Expected Due Date</p>
                          <p className="text-lg font-semibold text-slate-900 dark:text-white">
                            {selectedMother.expectedDeliveryDate
                              ? format(new Date(selectedMother.expectedDeliveryDate), 'MMMM d, yyyy')
                              : 'Not provided'}
                          </p>
                        </div>
                      </div>
                      {currentWeek !== null && (
                        <div>
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>Progress</span>
                            <span>{Math.round((currentWeek / 40) * 100)}%</span>
                          </div>
                          <div className="h-2 bg-pink-200 dark:bg-pink-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all"
                              style={{ width: `${(currentWeek / 40) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {selectedMother.riskFactors && selectedMother.riskFactors.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Risk Factors:</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedMother.riskFactors.map((factor, idx) => (
                              <Badge key={idx} variant="warning">{factor}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )}

              {motherChildren.length > 0 && (
                <div>
                  <SectionTitle title="Children" />
                  <div className="space-y-3">
                    {motherChildren.map((child) => {
                      const childName = `${child.firstName} ${child.lastName}`.trim();
                      return (
                        <Card key={child.id}>
                          <div className="flex items-center gap-4">
                            <Avatar name={childName} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-slate-900 dark:text-white">{childName}</p>
                                <Badge variant={child.gender === 'male' ? 'info' : 'default'}>
                                  {child.gender === 'male' ? '♂ Male' : '♀ Female'}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-500">
                                {getChildAge(child.dateOfBirth)} • Born {format(new Date(child.dateOfBirth), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  variant="secondary"
                  icon={Calendar}
                  onClick={() => {
                    setSelectedMother(null);
                    router.push('/appointments');
                  }}
                >
                  Schedule Appointment
                </Button>
                <Button
                  variant="secondary"
                  icon={FileText}
                  onClick={() => {
                    setSelectedMother(null);
                    router.push('/pregnancies');
                  }}
                >
                  View Pregnancy Records
                </Button>
                <Button
                  variant="secondary"
                  icon={Phone}
                  onClick={() => handleCall(contactPhone)}
                >
                  Call Patient
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Child Detail Modal */}
      <Modal
        isOpen={!!selectedChild}
        onClose={() => setSelectedChild(null)}
        title="Child Details"
        size="lg"
      >
        {selectedChild && (() => {
          const childName = `${selectedChild.firstName} ${selectedChild.lastName}`.trim();
          const parentPhone = selectedChild.emergencyContact || '';

          return (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Avatar name={childName} size="xl" />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {childName}
                  </h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant={selectedChild.gender === 'male' ? 'info' : 'default'}>
                      {selectedChild.gender === 'male' ? '♂ Male' : '♀ Female'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase">Age</label>
                  <p className="text-slate-900 dark:text-white">
                    {getChildAge(selectedChild.dateOfBirth)}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase">Mother</label>
                  <p className="text-slate-900 dark:text-white">
                    {selectedChild.motherName || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase">Emergency Contact</label>
                  {parentPhone ? (
                    <button
                      type="button"
                      className="text-slate-900 dark:text-white hover:text-slate-600"
                      onClick={() => handleCall(parentPhone)}
                    >
                      {parentPhone}
                    </button>
                  ) : (
                    <p className="text-slate-900 dark:text-white">Not provided</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase">Address</label>
                  <p className="text-slate-900 dark:text-white">
                    {selectedChild.address || 'Not provided'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  variant="secondary"
                  icon={Calendar}
                  onClick={() => {
                    setSelectedChild(null);
                    router.push('/appointments');
                  }}
                >
                  Schedule Appointment
                </Button>
                <Button
                  variant="secondary"
                  icon={FileText}
                  onClick={() => {
                    setSelectedChild(null);
                    router.push('/children');
                  }}
                >
                  View Child Records
                </Button>
                <Button
                  variant="secondary"
                  icon={Phone}
                  onClick={() => handleCall(parentPhone)}
                >
                  Call Parent
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* New Patient Modal (simplified) */}
      <Modal
        isOpen={showNewPatientModal}
        onClose={() => setShowNewPatientModal(false)}
        title="Register New Patient"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Choose the type of patient you want to register. Registration uses QR flow.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card
              hover
              className="cursor-pointer border-2 border-transparent hover:border-pink-500"
              onClick={() => {
                setShowNewPatientModal(false);
                router.push('/pregnancies');
              }}
            >
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8 text-pink-500" />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">New Pregnancy</p>
                  <p className="text-sm text-slate-500">Register antenatal care</p>
                </div>
              </div>
            </Card>
            <Card
              hover
              className="cursor-pointer border-2 border-transparent hover:border-blue-500"
              onClick={() => {
                setShowNewPatientModal(false);
                router.push('/children');
              }}
            >
              <div className="flex items-center gap-3">
                <Baby className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">New Child</p>
                  <p className="text-sm text-slate-500">Register child health</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowNewPatientModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
