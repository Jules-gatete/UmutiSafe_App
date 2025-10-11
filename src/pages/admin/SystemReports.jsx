import React, { useState } from 'react';
import { Download, FileText, Calendar } from 'lucide-react';
import Input from '../../components/FormFields/Input';

export default function SystemReports() {
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  const reportTypes = [
    {
      id: 'disposal-summary',
      title: 'Disposal Summary Report',
      description: 'Overview of all medicine disposals by category, risk level, and status',
      icon: FileText,
    },
    {
      id: 'chw-performance',
      title: 'CHW Performance Report',
      description: 'Community Health Worker pickup statistics and completion rates',
      icon: FileText,
    },
    {
      id: 'user-activity',
      title: 'User Activity Report',
      description: 'User engagement, registrations, and disposal patterns',
      icon: FileText,
    },
    {
      id: 'risk-analysis',
      title: 'Risk Level Analysis',
      description: 'Distribution and trends of high-risk medicine disposals',
      icon: FileText,
    },
    {
      id: 'geographic-distribution',
      title: 'Geographic Distribution',
      description: 'Medicine disposal activities by sector and district',
      icon: FileText,
    },
  ];

  const handleExport = (format, reportId) => {
    alert(
      `Exporting ${reportId} as ${format.toUpperCase()}\n\nDate Range: ${
        dateRange.start || 'All time'
      } to ${dateRange.end || 'Now'}\n\nIn production, this would generate and download the report file.`
    );
  };

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-text-dark dark:text-text-light mb-2">
        System Reports
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Generate and export comprehensive system reports
      </p>

      <div className="card mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Report Filters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            id="startDate"
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          />
          <Input
            label="End Date"
            id="endDate"
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <div key={report.id} className="card">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-blue bg-opacity-10 dark:bg-accent-cta dark:bg-opacity-10 rounded-lg flex-shrink-0">
                  <Icon className="w-6 h-6 text-primary-blue dark:text-accent-cta" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">{report.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {report.description}
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => handleExport('csv', report.id)}
                      className="btn-outline py-2 px-4 text-sm flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                    <button
                      onClick={() => handleExport('pdf', report.id)}
                      className="btn-outline py-2 px-4 text-sm flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export PDF
                    </button>
                    <button
                      onClick={() => handleExport('xlsx', report.id)}
                      className="btn-outline py-2 px-4 text-sm flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export Excel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card mt-6 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20">
        <h3 className="font-semibold mb-2">Report Generation Notes</h3>
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
          <li>Reports are generated based on the selected date range</li>
          <li>Leave date fields empty to include all historical data</li>
          <li>CSV format is recommended for data analysis in Excel or other tools</li>
          <li>PDF format is ideal for printing and official documentation</li>
          <li>All reports include timestamps and are audit-logged</li>
        </ul>
      </div>
    </div>
  );
}
