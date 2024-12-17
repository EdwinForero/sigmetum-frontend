import React, { useState } from "react";
import ButtonPrincipal from "./ButtonPrincipal";
import DialogAdvice from "./DialogAdvice";
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';

const ContactForm = ({
  onLoad
}) => {
  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const { t } = useTranslation();
  const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8000';

  const handleSubmit = async (e) => {
    onLoad(true);
    e.preventDefault();
  
    const payload = {
      username,
      email,
      subject,
      message,
    };
  
    try {
      const response = await fetch(`${BASE_URL}/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
  
      if (response.ok) {
        setDialogMessage(t('dialogAdvice.successEmailMessage'));
        setDialogType('success');
        setDialogVisible(true);
      } else {
        setDialogMessage(t('dialogAdvice.errorEmailMessage'));
        setDialogType('error');
        setDialogVisible(true);
      }
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
    } finally {
      onLoad(false);
    }
  };

  const closeDialog = () => {
    setDialogVisible(false);
    setDialogMessage('');
  };

  return (
    <div className="bg-[#F9FBFA] max-w-md w-full">
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="mb-4 px-4">
          <label className="block text-[#111418] text-base font-medium mb-2">
            {t('home.contactForm.nameLabel')}
          </label>
          <input
            type="text"
            placeholder={t('home.contactForm.namePlaceholder')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-input w-full h-12 px-3 bg-[#F9FBFA] border border-[#15B659] rounded-lg placeholder:text-[#99BBA8] text-[#0C1811] focus:outline-none"
          />
        </div>

        <div className="mb-4 px-4">
          <label className="block text-[#111418] text-base font-medium mb-2">
            {t('home.contactForm.emailPlaceholder')}
          </label>
          <input
            type="email"
            placeholder={t('home.contactForm.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input w-full h-12 px-3 bg-[#F9FBFA] border border-[#15B659] rounded-lg placeholder:text-[#99BBA8] text-[#0C1811] focus:outline-none"
          />
        </div>

        <div className="mb-4 px-4">
          <label className="block text-[#111418] text-base font-medium mb-2">
            {t('home.contactForm.subjectPlaceholder')}
          </label>
          <input
            type="text"
            placeholder={t('home.contactForm.subjectPlaceholder')}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="form-input w-full h-12 px-3 bg-[#F9FBFA] border border-[#15B659] rounded-lg placeholder:text-[#99BBA8] text-[#0C1811] focus:outline-none"
          />
        </div>

        <div className="mb-4 px-4">
          <label className="block text-[#111418] text-base font-medium mb-2">
            {t('home.contactForm.messagePlaceholder')}
          </label>
          <textarea
            placeholder={t('home.contactForm.messagePlaceholder')}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="form-input w-full h-24 px-3 bg-[#F9FBFA] border border-[#15B659] rounded-lg placeholder:text-[#99BBA8] text-[#0C1811] focus:outline-none"
          />
        </div>

        <div className="flex justify-center px-4">
          <ButtonPrincipal 
            text={t('home.contactForm.sendButton')} 
            disabled={!username || !email || !subject || !message}
          />
        </div>

        <AnimatePresence>
          {dialogVisible && (
            <DialogAdvice 
              dialogTitle={`${dialogType === 'success' ? t('dialogAdvice.successTitle') : t('dialogAdvice.errorTitle')}`}
              dialogMessage={dialogMessage} 
              onClose={closeDialog}
            />
          )}
        </AnimatePresence>
      </form>
    </div>
  );
};

export default ContactForm;