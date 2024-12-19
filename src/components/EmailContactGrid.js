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
      <div className="grid grid-cols-2 gap-4 text-sm font-normal mt-2">
        {emailList.map((item, index) => (
          <div key={index} className="flex flex-col space-y-1">
            <span className="text-[#0C1811] font-semibold">{item.name}</span>
            <a href={`mailto:${item.email}`} className="italic text-[#4B644A] hover:underline">
                {item.email}
            </a>
        </div>
        ))}
      </div>
    );
  };
  
  export default EmailContactGrid;