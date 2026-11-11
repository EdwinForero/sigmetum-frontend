import React, { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ButtonPrincipal from './ButtonPrincipal';
import InlineError from './InlineError';
import api from '../services/api';
import useToast from '../hooks/useToast';

const ContactForm = ({ onLoad }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const { t } = useTranslation();
  const id = useId();
  const { notifySuccess } = useToast();
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (e) => {
    onLoad(true);
    e.preventDefault();
    setFormError(null);
    try {
      await api.post('/send-email', { username, email, subject, message });
      notifySuccess(t('dialogAdvice.successEmailMessage'));
    } catch (error) {
      const messageKey =
        error.status === 429
          ? 'dialogAdvice.errorEmailRateLimit'
          : error.status === 400
            ? 'dialogAdvice.errorEmailInvalid'
            : 'dialogAdvice.errorEmailMessage';
      setFormError(messageKey);
    } finally {
      onLoad(false);
    }
  };

  return (
    <div className="bg-[#F9FBFA] max-w-md w-full">
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="mb-4 px-4">
          <label htmlFor={`${id}-name`} className="block text-[#111418] text-base font-medium mb-2">
            {t('home.contactForm.nameLabel')}
          </label>
          <input
            id={`${id}-name`}
            type="text"
            placeholder={t('home.contactForm.namePlaceholder')}
            maxLength={100}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-input w-full h-12 px-3 bg-[#F9FBFA] border border-[#15B659] rounded-lg placeholder:text-[#99BBA8] text-[#0C1811] focus-ring"
          />
        </div>

        <div className="mb-4 px-4">
          <label htmlFor={`${id}-email`} className="block text-[#111418] text-base font-medium mb-2">
            {t('home.contactForm.emailPlaceholder')}
          </label>
          <input
            id={`${id}-email`}
            type="email"
            placeholder={t('home.contactForm.emailPlaceholder')}
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input w-full h-12 px-3 bg-[#F9FBFA] border border-[#15B659] rounded-lg placeholder:text-[#99BBA8] text-[#0C1811] focus-ring"
          />
        </div>

        <div className="mb-4 px-4">
          <label htmlFor={`${id}-subject`} className="block text-[#111418] text-base font-medium mb-2">
            {t('home.contactForm.subjectPlaceholder')}
          </label>
          <input
            id={`${id}-subject`}
            type="text"
            placeholder={t('home.contactForm.subjectPlaceholder')}
            maxLength={150}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="form-input w-full h-12 px-3 bg-[#F9FBFA] border border-[#15B659] rounded-lg placeholder:text-[#99BBA8] text-[#0C1811] focus-ring"
          />
        </div>

        <div className="mb-4 px-4">
          <label htmlFor={`${id}-message`} className="block text-[#111418] text-base font-medium mb-2">
            {t('home.contactForm.messagePlaceholder')}
          </label>
          <textarea
            id={`${id}-message`}
            placeholder={t('home.contactForm.messagePlaceholder')}
            maxLength={2000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="form-input w-full h-24 px-3 bg-[#F9FBFA] border border-[#15B659] rounded-lg placeholder:text-[#99BBA8] text-[#0C1811] focus-ring"
          />
        </div>

        {formError && (
          <div className="px-4">
            <InlineError>{t(formError)}</InlineError>
          </div>
        )}

        <div className="flex justify-center px-4">
          <ButtonPrincipal
            type="submit"
            text={t('home.contactForm.sendButton')}
            disabled={!username || !email || !subject || !message}
          />
        </div>
      </form>
    </div>
  );
};

export default ContactForm;
