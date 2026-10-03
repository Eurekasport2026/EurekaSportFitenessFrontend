"use client";

import { useState, type FormEvent } from "react";
import { T, useLanguage } from "@/components/layout/LanguageProvider";
import styles from "./contact.module.css";

export function ContactForm() {
  const [unavailable, setUnavailable] = useState(false);
  const { language } = useLanguage();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUnavailable(true);
  }

  return (
    <form className={styles.form} method="post" action="/contatti" onSubmit={handleSubmit}>
      <label htmlFor="contact-name"><T>Nome</T></label>
      <input id="contact-name" name="name" type="text" autoComplete="name" required maxLength={120} />
      <label htmlFor="contact-email">Email</label>
      <input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254} />
      <label htmlFor="contact-subject"><T>Oggetto</T></label>
      <select id="contact-subject" name="subject" defaultValue="" required>
        <option value="" disabled>{language === "en" ? "Select..." : "Seleziona..."}</option>
        <option value="academy">{language === "en" ? "Academy courses" : "Corsi Accademia"}</option>
        <option value="training">{language === "en" ? "Eureka! Training" : "Eureka! Allenamento"}</option>
        <option value="app">Eureka! Fit</option>
        <option value="other">{language === "en" ? "Other information" : "Altre informazioni"}</option>
      </select>
      <label htmlFor="contact-message"><T>Messaggio</T></label>
      <textarea id="contact-message" name="message" rows={5} required maxLength={4000} />
      <button type="submit"><T>Invia messaggio</T></button>
      {unavailable && <p className={styles.formStatus} role="status">{language === "en" ? "The form is not active yet. You can email us at " : "Il modulo non è ancora attivo. Puoi scriverci a "}<a href="mailto:info@eurekasportfitness.it">info@eurekasportfitness.it</a>.</p>}
    </form>
  );
}
