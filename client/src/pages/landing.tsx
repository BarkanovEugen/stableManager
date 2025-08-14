import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import VKAuth from "@/components/auth/vk-auth";
import { Rabbit, Heart, Target, Phone, Mail, MapPin, Calendar, Users, Trophy } from "lucide-react";

export default function LandingPage() {
  const [showVKAuth, setShowVKAuth] = useState(false);

  return (
    <div className="min-h-screen bg-background" data-testid="landing-page">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Rabbit className="text-primary text-2xl mr-3" data-testid="logo-icon" />
              <h1 className="text-xl font-semibold text-gray-900" data-testid="site-title">
                Конюшня "Солнечная Поляна"
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <a href="#events" className="text-muted hover:text-primary transition-colors" data-testid="link-events">
                Мероприятия
              </a>
              <a href="#news" className="text-muted hover:text-primary transition-colors" data-testid="link-news">
                Новости
              </a>
              <Button
                onClick={() => setShowVKAuth(true)}
                className="bg-primary text-white hover:bg-blue-700"
                data-testid="button-login"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zM18.947 17.053c-.439.439-.586.463-1.102.463h-1.707c-.702 0-.913-.566-2.158-1.81-1.089-1.089-1.566-1.217-1.839-1.217-.375 0-.478.103-.478.6v1.652c0 .448-.145.717-1.33.717-1.954 0-4.117-1.183-5.633-3.383-2.278-3.269-2.904-5.724-2.904-6.22 0-.273.103-.526.6-.526h1.707c.448 0 .615.206.787.688.878 2.483 2.344 4.651 2.946 4.651.225 0 .324-.103.324-.668V9.738c-.067-1.114-.653-1.207-.653-1.605 0-.223.183-.439.478-.439h2.687c.375 0 .513.206.513.651v3.498c0 .375.171.513.274.513.225 0 .41-.138.822-.549 1.251-1.404 2.145-3.566 2.145-3.566.12-.274.326-.526.774-.526h1.707c.536 0 .649.274.536.651-.206 1.217-2.465 4.191-2.465 4.191-.188.308-.257.445 0 .72.188.206 1.251 1.217 1.371 1.337.479.479.479.719.479.719s.547 1.228-1.228 1.228z"/>
                </svg>
                Войти через VK ID
              </Button>
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
          <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6" data-testid="hero-title">
            Добро пожаловать в нашу конюшню
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto" data-testid="hero-description">
            Профессиональные занятия верховой ездой, иппотерапия и незабываемые прогулки с лошадьми в живописной природе
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-primary text-white hover:bg-blue-700"
              data-testid="button-book-lesson"
            >
              Записаться на занятие
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white text-primary hover:bg-gray-100"
              data-testid="button-learn-more"
            >
              Узнать больше
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center mb-12" data-testid="services-title">
            Наши услуги
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <Users className="text-primary text-4xl mb-4 mx-auto" />
                <h4 className="text-xl font-semibold mb-3" data-testid="service-title-training">
                  Обучение верховой езде
                </h4>
                <p className="text-muted-foreground" data-testid="service-description-training">
                  Занятия для новичков и опытных всадников с профессиональными инструкторами
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <Heart className="text-primary text-4xl mb-4 mx-auto" />
                <h4 className="text-xl font-semibold mb-3" data-testid="service-title-therapy">
                  Иппотерапия
                </h4>
                <p className="text-muted-foreground" data-testid="service-description-therapy">
                  Лечебная верховая езда для реабилитации и улучшения самочувствия
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <Target className="text-primary text-4xl mb-4 mx-auto" />
                <h4 className="text-xl font-semibold mb-3" data-testid="service-title-archery">
                  Конная стрельба из лука
                </h4>
                <p className="text-muted-foreground" data-testid="service-description-archery">
                  Уникальные занятия по стрельбе из лука верхом на лошади
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center mb-12" data-testid="events-title">
            Предстоящие мероприятия
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300" 
                alt="Соревнования по конкуру" 
                className="w-full h-48 object-cover"
                data-testid="event-image-competition"
              />
              <CardContent className="p-6">
                <div className="text-sm text-primary font-medium mb-2" data-testid="event-date-competition">
                  15 декабря 2024
                </div>
                <h4 className="text-xl font-semibold mb-3" data-testid="event-title-competition">
                  Открытые соревнования по конкуру
                </h4>
                <p className="text-muted-foreground mb-4" data-testid="event-description-competition">
                  Приглашаем всех желающих на захватывающие соревнования по преодолению препятствий
                </p>
                <Button variant="link" className="p-0 text-primary" data-testid="button-event-details-competition">
                  Подробнее →
                </Button>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300" 
                alt="Мастер-класс для детей" 
                className="w-full h-48 object-cover"
                data-testid="event-image-masterclass"
              />
              <CardContent className="p-6">
                <div className="text-sm text-primary font-medium mb-2" data-testid="event-date-masterclass">
                  22 декабря 2024
                </div>
                <h4 className="text-xl font-semibold mb-3" data-testid="event-title-masterclass">
                  Мастер-класс для детей
                </h4>
                <p className="text-muted-foreground mb-4" data-testid="event-description-masterclass">
                  Специальное занятие для юных наездников с играми и развлечениями
                </p>
                <Button variant="link" className="p-0 text-primary" data-testid="button-event-details-masterclass">
                  Подробнее →
                </Button>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300" 
                alt="Новогодняя прогулка" 
                className="w-full h-48 object-cover"
                data-testid="event-image-newyear"
              />
              <CardContent className="p-6">
                <div className="text-sm text-primary font-medium mb-2" data-testid="event-date-newyear">
                  31 декабря 2024
                </div>
                <h4 className="text-xl font-semibold mb-3" data-testid="event-title-newyear">
                  Новогодняя прогулка
                </h4>
                <p className="text-muted-foreground mb-4" data-testid="event-description-newyear">
                  Праздничная конная прогулка с горячим чаем и подарками
                </p>
                <Button variant="link" className="p-0 text-primary" data-testid="button-event-details-newyear">
                  Подробнее →
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* News Section */}
      <section id="news" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center mb-12" data-testid="news-title">
            Новости
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <article className="flex flex-col md:flex-row gap-4">
              <img 
                src="https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250" 
                alt="Новые лошади в конюшне" 
                className="w-full md:w-48 h-32 md:h-auto object-cover rounded-lg"
                data-testid="news-image-horses"
              />
              <div>
                <div className="text-sm text-muted-foreground mb-2" data-testid="news-date-horses">
                  5 декабря 2024
                </div>
                <h4 className="text-xl font-semibold mb-3" data-testid="news-title-horses">
                  Пополнение в нашей конюшне
                </h4>
                <p className="text-muted-foreground" data-testid="news-description-horses">
                  К нам прибыли три новые лошади: Звездочка, Буран и Ветер. Все они уже готовы к занятиям!
                </p>
              </div>
            </article>
            
            <article className="flex flex-col md:flex-row gap-4">
              <img 
                src="https://images.unsplash.com/photo-1560807707-8cc77767d783?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=250" 
                alt="Обновление программ" 
                className="w-full md:w-48 h-32 md:h-auto object-cover rounded-lg"
                data-testid="news-image-programs"
              />
              <div>
                <div className="text-sm text-muted-foreground mb-2" data-testid="news-date-programs">
                  28 ноября 2024
                </div>
                <h4 className="text-xl font-semibold mb-3" data-testid="news-title-programs">
                  Обновление учебных программ
                </h4>
                <p className="text-muted-foreground" data-testid="news-description-programs">
                  Мы расширили программы обучения и добавили новые курсы для продвинутых всадников.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Social Media & Contact */}
      <section className="py-16 bg-gray-50">
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

      {/* VK Auth Modal */}
      {showVKAuth && (
        <VKAuth onClose={() => setShowVKAuth(false)} />
      )}
    </div>
  );
}
