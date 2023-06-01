import PropTypes from 'prop-types';
import React from 'react';
import { Dropdown } from 'react-bootstrap';
import ReactDOM from 'react-dom';
import { useEffect, useState } from "react";
import './Suggestions.scss'
import { on } from 'events';

export default function Suggestions({
  show, selected, setSelected, startFiltered, items, curValue} : any) {
  const [filtered, setFiltered] = useState(startFiltered);
  const [filteredItems, setFilteredItems] = useState(items);
  const ref = React.useRef<HTMLDivElement>(null);
  const [hasFocus, setFocus] = useState(false);

  useEffect(() => {
    if (ref.current) {
      // mouseenter instead of focus, because focus doesn't apply when hovering
      ref.current.addEventListener('mouseenter', () => setFocus(true));
      ref.current.addEventListener('mouseleave', () => setFocus(false));
    }
    return () => {
      if (!(!ref || !ref.current)) {
        ref.current.removeEventListener('mouseenter', () => setFocus(true));
        ref.current.removeEventListener('mouseleave', () => setFocus(false));
      }
    };
  }, [ref.current]);

  function isSelectedItem(item: any): boolean {
    return item.key === selected;
  }

  function onSelect(item: any) {
    setSelected(item.key);
    setFocus(false);
  }

  function filter(items: any): any {
    if (!filtered) {
      return items;
    } else {
      if (curValue !== "")
        return items.filter((item: any) => item.value.toLowerCase().includes(curValue.toLowerCase()));
      else
        return items;
    }
  }

  useEffect(() => {
    setFilteredItems(filter(items));
  }, [items, filtered, curValue]);

  function _renderItem(item: any): any {
    const active = isSelectedItem(item);

    let color = "black"
    if (!active){
      if (item.type === "group") {
        color = "#9d00ff"
      } 
      if (item.type === "contact") {
        color = "#698269"
      }
    }

    return <Dropdown.Item
      active={active}
      style={{color: color}}
        //className={index === this.props.focusedIndex && !active ? 'pseudofocused' : undefined}
        eventKey={item}
        key={item.key}
        onClick={() => {onSelect(item)}}>
      {item.value}
    </Dropdown.Item>
  }

  return (
    <div className="suggestions" ref={ref}>
      <Dropdown.Menu className={show || hasFocus ? 'show' : ''} >
        <Dropdown.Header>{filteredItems.length > 0 ? 'Filtered chat names:' : 'No matches!'}</Dropdown.Header>
        {filteredItems.map(_renderItem)}
        {filtered && <Dropdown.Item key="show-all" onSelect={() => setFiltered(false)}>
          <span className="show-all">
            {items.length === 0 ? <span className="no-matches" /> : null}
          </span>
        </Dropdown.Item>}
      </Dropdown.Menu>
    </div>
  );
  
}