import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { VKLoginButton } from "@/components/vk-login-button";
import { useAuth } from "@/hooks/use-auth";
import { Rabbit, Heart, Target, Phone, Mail, MapPin, Calendar, Users, Trophy, Settings, Edit3, Save, X, Plus, Trash2, Edit } from "lucide-react";
import type { News, Event, Service, Review } from "@shared/content-schema";
import { ContentStorage } from "@/lib/content-storage";
import "../types/review-lab.d.ts";

export default function LandingPage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  const [editableContent, setEditableContent] = useState(() => ContentStorage.getContent());
  const [events, setEvents] = useState<Event[]>(() => ContentStorage.getEvents());
  const [services, setServices] = useState<Service[]>(() => ContentStorage.getServices());

  // Save to localStorage whenever data changes
  useEffect(() => {
    ContentStorage.saveContent(editableContent);
  }, [editableContent]);

  useEffect(() => {
    ContentStorage.saveEvents(events);
  }, [events]);

  useEffect(() => {
    ContentStorage.saveServices(services);
  }, [services]);



  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    eventDate: "",
    location: "",
    maxParticipants: 0,
    isActive: true
  });

  const [serviceForm, setServiceForm] = useState({
    title: "",
    description: "",
    price: "",
    duration: "",
    isActive: true,
    order: 0
  });

  const handleSaveContent = () => {
    setIsEditing(false);
  };

  const handleEventSubmit = () => {
    if (editingEvent) {
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? 
        { ...editingEvent, ...eventForm, updatedAt: new Date().toISOString() } : e
      ));
    } else {
      const newEvent: Event = {
        ...eventForm,
        id: Date.now().toString(),
        registeredParticipants: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setEvents(prev => [newEvent, ...prev]);
    }
    setShowEventModal(false);
    setEditingEvent(null);
    setEventForm({ title: "", description: "", imageUrl: "", eventDate: "", location: "", maxParticipants: 0, isActive: true });
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      imageUrl: event.imageUrl || "",
      eventDate: event.eventDate,
      location: event.location || "",
      maxParticipants: event.maxParticipants || 0,
      isActive: event.isActive
    });
    setShowEventModal(true);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleServiceSubmit = () => {
    if (editingService) {
      setServices(prev => prev.map(s => s.id === editingService.id ? 
        { ...editingService, ...serviceForm, updatedAt: new Date().toISOString() } : s
      ));
    } else {
      const newService: Service = {
        ...serviceForm,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setServices(prev => [...prev, newService].sort((a, b) => a.order - b.order));
    }
    setShowServiceModal(false);
    setEditingService(null);
    setServiceForm({ title: "", description: "", price: "", duration: "", isActive: true, order: 0 });
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setServiceForm({
      title: service.title,
      description: service.description,
      price: service.price || "",
      duration: service.duration || "",
      isActive: service.isActive,
      order: service.order
    });
    setShowServiceModal(true);
  };

  const handleDeleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const canEdit = user?.role === "administrator";

  return (
    <div className="min-h-screen bg-background" data-testid="landing-page">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Rabbit className="text-primary text-2xl mr-3" data-testid="logo-icon" />
              {isEditing ? (
                <Input
                  value={editableContent.siteTitle}
                  onChange={(e) => setEditableContent(prev => ({ ...prev, siteTitle: e.target.value }))}
                  className="text-xl font-semibold max-w-xs"
                  data-testid="edit-site-title"
                />
              ) : (
                <h1 className="text-xl font-semibold text-gray-900" data-testid="site-title">
                  {editableContent.siteTitle}
                </h1>
              )}
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Навигационные ссылки - скрыты на малых экранах */}
              <div className="hidden md:flex items-center space-x-4">
                <a href="#events" className="text-muted hover:text-primary transition-colors" data-testid="link-events">
                  Мероприятия
                </a>
              </div>
              
              {canEdit && (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  {isEditing ? (
                    <>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={handleSaveContent}
                        className="bg-green-600 text-white hover:bg-green-700"
                        data-testid="button-save-content"
                      >
                        <Save className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Сохранить</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsEditing(false)}
                        data-testid="button-cancel-edit"
                      >
                        <X className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Отмена</span>
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="border-orange-500 text-orange-500 hover:bg-orange-50"
                      data-testid="button-edit-content"
                    >
                      <Edit3 className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Редактировать</span>
                    </Button>
                  )}
                </div>
              )}
              {user ? (
                <Link href="/dashboard">
                  <Button 
                    variant="default" 
                    size="sm"
                    className="bg-primary text-white hover:bg-blue-700"
                    data-testid="button-admin-panel"
                  >
                    <Settings className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Панель управления</span>
                    <span className="sm:hidden">CRM</span>
                  </Button>
                </Link>
              ) : (
                <VKLoginButton />
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080')"
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {isEditing ? (
            <div className="space-y-4">
              <Input
                value={editableContent.heroTitle}
                onChange={(e) => setEditableContent(prev => ({ ...prev, heroTitle: e.target.value }))}
                className="text-4xl lg:text-6xl font-bold text-center bg-white/90 backdrop-blur-sm border-2 border-white"
                data-testid="edit-hero-title"
              />
              <Textarea
                value={editableContent.heroDescription}
                onChange={(e) => setEditableContent(prev => ({ ...prev, heroDescription: e.target.value }))}
                className="text-xl text-center bg-white/90 backdrop-blur-sm border-2 border-white max-w-3xl mx-auto"
                rows={3}
                data-testid="edit-hero-description"
              />
            </div>
          ) : (
            <>
              <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6" data-testid="hero-title">
                {editableContent.heroTitle}
              </h2>
              <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto" data-testid="hero-description">
                {editableContent.heroDescription}
              </p>
            </>
          )}
          <div className="flex justify-center">
            <Button 
              size="lg" 
              className="bg-primary text-white hover:bg-blue-700"
              data-testid="button-book-lesson"
            >
              Записаться на занятие
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            {isEditing ? (
              <Input
                value={editableContent.servicesTitle}
                onChange={(e) => setEditableContent(prev => ({ ...prev, servicesTitle: e.target.value }))}
                className="text-3xl font-bold border-2 border-gray-300 max-w-md"
                data-testid="edit-services-title"
              />
            ) : (
              <h3 className="text-3xl font-bold" data-testid="services-title">
                {editableContent.servicesTitle}
              </h3>
            )}
            {canEdit && (
              <Button 
                onClick={() => setShowServiceModal(true)}
                className="bg-purple-600 text-white hover:bg-purple-700"
                data-testid="button-add-service"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить услугу
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.filter(service => service.isActive).sort((a, b) => a.order - b.order).map((service) => (
              <Card key={service.id} className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-xl mb-2" data-testid={`service-title-${service.id}`}>
                      {service.title}
                    </h4>
                    <p className="text-muted-foreground mb-3" data-testid={`service-description-${service.id}`}>
                      {service.description}
                    </p>
                    {service.price && (
                      <p className="text-primary font-medium mb-1" data-testid={`service-price-${service.id}`}>
                        {service.price}
                      </p>
                    )}
                    {service.duration && (
                      <p className="text-sm text-muted-foreground" data-testid={`service-duration-${service.id}`}>
                        Продолжительность: {service.duration}
                      </p>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex gap-2 justify-center">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditService(service)}
                        data-testid={`button-edit-service-${service.id}`}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Изменить
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteService(service.id)}
                        data-testid={`button-delete-service-${service.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Удалить
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            {isEditing ? (
              <Input
                value={editableContent.eventsTitle}
                onChange={(e) => setEditableContent(prev => ({ ...prev, eventsTitle: e.target.value }))}
                className="text-3xl font-bold border-2 border-gray-300 max-w-md"
                data-testid="edit-events-title"
              />
            ) : (
              <h3 className="text-3xl font-bold" data-testid="events-title">
                {editableContent.eventsTitle}
              </h3>
            )}
            {canEdit && (
              <Button 
                onClick={() => setShowEventModal(true)}
                className="bg-green-600 text-white hover:bg-green-700"
                data-testid="button-add-event"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить мероприятие
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.filter(event => event.isActive).map((event) => (
              <Card key={event.id} className="overflow-hidden">
                {event.imageUrl && (
                  <img 
                    src={event.imageUrl} 
                    alt={event.title}
                    className="w-full h-48 object-cover"
                    data-testid={`event-image-${event.id}`}
                  />
                )}
                <CardContent className="p-6">
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(event.eventDate).toLocaleDateString('ru-RU')}
                  </div>
                  <h4 className="text-xl font-semibold mb-3" data-testid={`event-title-${event.id}`}>
                    {event.title}
                  </h4>
                  <p className="text-muted-foreground mb-4" data-testid={`event-description-${event.id}`}>
                    {event.description}
                  </p>
                  {event.location && (
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {event.location}
                    </div>
                  )}
                  {event.maxParticipants && (
                    <div className="flex items-center text-sm text-muted-foreground mb-4">
                      <Users className="w-4 h-4 mr-1" />
                      {event.registeredParticipants}/{event.maxParticipants} участников
                    </div>
                  )}
                  <div className="flex gap-2">
                    {!canEdit && (
                      <Button size="sm" className="flex-1" data-testid={`button-register-event-${event.id}`}>
                        Зарегистрироваться
                      </Button>
                    )}
                    {canEdit && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditEvent(event)}
                          data-testid={`button-edit-event-${event.id}`}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Изменить
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteEvent(event.id)}
                          data-testid={`button-delete-event-${event.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Удалить
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>





      {/* Reviews Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4" data-testid="reviews-title">
              Отзывы наших клиентов
            </h3>
            <p className="text-muted-foreground" data-testid="reviews-subtitle">
              Узнайте, что говорят о нас наши ученики и их родители
            </p>
          </div>
          
          {/* ReviewLab Widget */}
          <div className="max-w-4xl mx-auto">
            <review-lab data-widgetid="689f02e05878d3b77a65f707"></review-lab>
          </div>
        </div>
      </section>

      {/* Social Media & Contact */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold mb-8" data-testid="social-title">
            Следите за нами в социальных сетях
          </h3>
          <div className="flex justify-center space-x-6 mb-8">
            <a 
              href="#" 
              className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors"
              data-testid="link-vk"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0z"/>
              </svg>
            </a>
            <a 
              href="#" 
              className="bg-blue-400 text-white p-3 rounded-full hover:bg-blue-500 transition-colors"
              data-testid="link-telegram"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </a>
            <a 
              href="#" 
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-full hover:from-purple-600 hover:to-pink-600 transition-colors"
              data-testid="link-instagram"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          </div>
          <div className="text-muted-foreground space-y-2">
            <p className="flex items-center justify-center" data-testid="contact-phone">
              <Phone className="mr-2" size={16} />
              +7 (999) 123-45-67
            </p>
            <p className="flex items-center justify-center" data-testid="contact-email">
              <Mail className="mr-2" size={16} />
              info@solnechnaya-polyana.ru
            </p>
            <p className="flex items-center justify-center" data-testid="contact-address">
              <MapPin className="mr-2" size={16} />
              Московская область, деревня Солнечная
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p data-testid="footer-copyright">
            &copy; 2024 Конюшня "Солнечная Поляна". Все права защищены.
          </p>
        </div>
      </footer>



      {/* Event Modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Редактировать мероприятие" : "Добавить мероприятие"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="event-title">Название</Label>
              <Input
                id="event-title"
                value={eventForm.title}
                onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Введите название мероприятия"
                data-testid="input-event-title"
              />
            </div>
            <div>
              <Label htmlFor="event-description">Описание</Label>
              <Textarea
                id="event-description"
                value={eventForm.description}
                onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Введите описание мероприятия"
                rows={3}
                data-testid="textarea-event-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event-date">Дата проведения</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={eventForm.eventDate}
                  onChange={(e) => setEventForm(prev => ({ ...prev, eventDate: e.target.value }))}
                  data-testid="input-event-date"
                />
              </div>
              <div>
                <Label htmlFor="event-participants">Максимум участников</Label>
                <Input
                  id="event-participants"
                  type="number"
                  value={eventForm.maxParticipants}
                  onChange={(e) => setEventForm(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  data-testid="input-event-participants"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="event-location">Место проведения (опционально)</Label>
              <Input
                id="event-location"
                value={eventForm.location}
                onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Введите место проведения"
                data-testid="input-event-location"
              />
            </div>
            <div>
              <Label htmlFor="event-image">URL изображения (опционально)</Label>
              <Input
                id="event-image"
                value={eventForm.imageUrl}
                onChange={(e) => setEventForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://example.com/image.jpg"
                data-testid="input-event-image"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowEventModal(false)}
                data-testid="button-cancel-event"
              >
                Отмена
              </Button>
              <Button
                onClick={handleEventSubmit}
                disabled={!eventForm.title || !eventForm.description || !eventForm.eventDate}
                data-testid="button-save-event"
              >
                {editingEvent ? "Сохранить" : "Добавить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Service Modal */}
      <Dialog open={showServiceModal} onOpenChange={setShowServiceModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Редактировать услугу" : "Добавить услугу"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="service-title">Название</Label>
              <Input
                id="service-title"
                value={serviceForm.title}
                onChange={(e) => setServiceForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Введите название услуги"
                data-testid="input-service-title"
              />
            </div>
            <div>
              <Label htmlFor="service-description">Описание</Label>
              <Textarea
                id="service-description"
                value={serviceForm.description}
                onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Введите описание услуги"
                rows={3}
                data-testid="textarea-service-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="service-price">Цена (опционально)</Label>
                <Input
                  id="service-price"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="от 2000₽"
                  data-testid="input-service-price"
                />
              </div>
              <div>
                <Label htmlFor="service-duration">Продолжительность (опционально)</Label>
                <Input
                  id="service-duration"
                  value={serviceForm.duration}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="45 мин"
                  data-testid="input-service-duration"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="service-order">Порядок отображения</Label>
              <Input
                id="service-order"
                type="number"
                value={serviceForm.order}
                onChange={(e) => setServiceForm(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                data-testid="input-service-order"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowServiceModal(false)}
                data-testid="button-cancel-service"
              >
                Отмена
              </Button>
              <Button
                onClick={handleServiceSubmit}
                disabled={!serviceForm.title || !serviceForm.description}
                data-testid="button-save-service"
              >
                {editingService ? "Сохранить" : "Добавить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
