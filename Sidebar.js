import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: '홈', icon: '🏠' },
    { path: '/background', label: '탐구 배경', icon: '🔍' },
    { path: '/experiment', label: '실험 진행', icon: '🧪' },
    { path: '/results', label: '실험 결과 및 웹페이지 제작', icon: '📊' },
    { path: '/ginger', label: '생강과 구강 청결제', icon: '🫚' },
    { path: '/natural-vs-chemical', label: '천연, 화학 합성 항균제의 항균 효과 비교', icon: '⚖️' },
    { path: '/environmental-impact', label: '천연, 화학 합성 항균제의 환경 영향 비교', icon: '🌱' },
    { path: '/conclusion', label: '결론', icon: '✅' }
  ];

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={toggleSidebar}></div>
      <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>항균제 연구</h2>
          <p>천연 vs 화학 합성</p>
        </div>
        
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link 
                to={item.path} 
                className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => window.innerWidth <= 768 && toggleSidebar()}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-label">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          <p>탐구 발표 자료</p>
          <small>2025</small>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
