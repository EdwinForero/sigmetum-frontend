import React from 'react';
import { useTranslation } from 'react-i18next';

const EmailContactGrid = () => {

    const { t } = useTranslation();
    const rawText = t('home.emailsData');

    const emailList = rawText
      .split('/')
      .reduce((acc, value, index, array) => {
        if (index % 2 === 0) {
          acc.push({ name: value.trim(), email: array[index + 1]?.trim() });
        }
        return acc;
      }, [])
      .filter(entry => entry.name && entry.email);

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack text-base font-normal mt-stack">
        {emailList.map((item, index) => (
          <div key={index} className="flex flex-col space-y-1">
            <span className="text-ink font-bold">{item.name}</span>
            <a href={`mailto:${item.email}`} className="focus-ring inline-flex min-h-11 items-center break-all text-moss underline">
                {item.email}
            </a>
        </div>
        ))}
      </div>
    );
  };

  export default EmailContactGrid;
