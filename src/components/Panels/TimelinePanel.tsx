// src/components/Panels/TimelinePanel.tsx
import React, { useState } from 'react';

interface TimelineEvent {
  id: string;
  date: string;
  description: string;
}

const TimelinePanel: React.FC = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([
    { id: '1', date: 'Chapter 1', description: 'Henry finds the Roosevelt artifact.' },
    { id: '2', date: 'Chapter 3', description: 'Eleanor uncovers a hidden clue at school.' },
  ]);
  const [newDate, setNewDate] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const addEvent = () => {
    if (!newDate || !newDescription) return;
    setEvents((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        date: newDate,
        description: newDescription,
      },
    ]);
    setNewDate('');
    setNewDescription('');
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-xl shadow-md flex flex-col h-full">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Timeline</h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          placeholder="Scene / Chapter"
          className="flex-1 p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-gray-100"
        />
        <textarea
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Description"
          rows={1}
          className="flex-1 p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-gray-100"
        />
        <button
          onClick={addEvent}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Add
        </button>
      </div>

      <ul className="space-y-2 overflow-y-auto flex-1">
        {events.map((event) => (
          <li
            key={event.id}
            className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg"
          >
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{event.date}</p>
              <p className="text-gray-700 dark:text-gray-300">{event.description}</p>
            </div>
            <button
              onClick={() => deleteEvent(event.id)}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TimelinePanel;
