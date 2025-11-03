import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import * as apiService from '../services/apiService';
import { Report } from '../types';
import { SpinnerIcon, TrashIcon, CheckCircleIcon } from '../hooks/Icons';

const ManageReports: React.FC = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { getAccessTokenSilently } = useAuth0();

    const fetchReports = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await getAccessTokenSilently();
            const data = await apiService.adminGetReports(token);
            setReports(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [getAccessTokenSilently]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleResolve = async (reportId: string) => {
        try {
            const token = await getAccessTokenSilently();
            await apiService.adminResolveReport(token, reportId);
            fetchReports(); // Refresh list
        } catch (err) {
            alert('Failed to resolve report.');
        }
    };

    const handleCensor = async (report: Report) => {
        const confirmText = `Are you sure you want to delete this ${report.type}? This is a permanent action.`;
        if (!window.confirm(confirmText)) return;

        try {
            const token = await getAccessTokenSilently();
            if (report.type === 'phrase') {
                await apiService.adminCensorPhrase(token, report.contentId);
            } else if (report.type === 'comment') {
                await apiService.adminDeleteComment(token, report.contentId);
            }
            await handleResolve(report._id); // Auto-resolve after action
        } catch (err) {
            alert(`Failed to delete ${report.type}.`);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><SpinnerIcon className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Pending Reports ({reports.length})</h2>
            {reports.length > 0 ? (
                <div className="space-y-4">
                    {reports.map(report => (
                        <div key={report._id} className="report-card admin-card">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-lg">Reported {report.type}: <span className="font-normal text-sm text-ink/70">by @{report.reporterUsername}</span></p>
                                    <blockquote className="my-2">{report.contentText}</blockquote>
                                    <p className="text-sm"><span className="font-bold">Reason:</span> {report.reason}</p>
                                </div>
                                <span className="text-xs text-ink/60 flex-shrink-0 ml-4">{new Date(report.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-end gap-2 mt-4 border-t border-ink/20 pt-3">
                                <button onClick={() => handleResolve(report._id)} className="btn-themed bg-green-500 text-white !py-1 !px-3 flex items-center gap-1">
                                    <CheckCircleIcon className="w-4 h-4" /> Dismiss
                                </button>
                                <button onClick={() => handleCensor(report)} className="btn-themed btn-themed-danger !py-1 !px-3 flex items-center gap-1">
                                    <TrashIcon className="w-4 h-4" /> Delete Content
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-ink/70">No pending reports. All clear!</p>
            )}
        </div>
    );
};

export default ManageReports;