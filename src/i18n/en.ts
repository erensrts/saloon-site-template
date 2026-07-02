import type { Dictionary } from "./tr";

export const en: Dictionary = {
  nav: {
    services: "Services",
    gallery: "Gallery",
    about: "About",
    testimonials: "Reviews",
    contact: "Contact",
    toggleMenu: "Toggle menu",
    cta: "Book Now",
  },
  hero: {
    ourServices: "Our services",
  },
  services: {
    eyebrow: "Services",
    heading: "Treatments crafted just for you",
    priceLabel: "Price",
  },
  gallery: {
    eyebrow: "Gallery",
    heading: "Moments from our studio",
    imageAlt: (i: number) => `Gallery image ${i}`,
  },
  about: {
    imageAlt: "Salon interior",
    teamHeading: "Meet our team",
  },
  testimonials: {
    eyebrow: "Reviews",
    heading: "What our clients say",
  },
  booking: {
    eyebrow: "Booking",
    heading: "We'd love to see you here",
    fields: {
      name: "Full name",
      phone: "Phone",
      email: "Email",
      service: "Service",
      servicePlaceholder: "Choose a service…",
      date: "Date",
      time: "Time",
      note: "Note (optional)",
    },
    submit: "Request via WhatsApp",
    submitting: "Redirecting…",
    info: {
      address: "Address",
      phone: "Phone",
      email: "Email",
      hours: "Opening hours",
    },
    mapTitle: "Our location",
    validation: {
      name: "Name must be at least 2 characters",
      phone: "Enter a valid phone number",
      email: "Enter a valid email",
      service: "Choose a service",
      date: "Pick a date",
      time: "Pick a time",
      generic: "Please review the form",
    },
    toastSuccess: "Sending your request via WhatsApp…",
    waMessage: {
      intro: "Hello, I'd like to book an appointment:",
      name: "Name",
      phone: "Phone",
      email: "Email",
      service: "Service",
      date: "Date",
      time: "Time",
      note: "Note",
    },
  },
  footer: {
    contact: "Contact",
    follow: "Follow us",
    rights: (year: number, name: string) =>
      `© ${year} ${name}. All rights reserved.`,
    credit: "Template design & build",
  },
  whatsapp: {
    defaultLabel: "Message us",
  },
};
