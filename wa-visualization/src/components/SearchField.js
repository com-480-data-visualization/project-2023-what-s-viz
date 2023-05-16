import { useEffect, useState } from "react";
import React from 'react';
import QRCode from "react-qr-code";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { FaSearch } from "react-icons/fa";
import Modal from 'react-bootstrap/Modal';
import { Container } from "react-bootstrap";
import Suggestions from "./Suggestions";

export default function SearchField({selected, setSelected, idToGroup, idToContact }) {
    const ref = React.useRef();
    const [hasFocus, setFocus] = useState(false);
    const [items, setItems] = useState([]);
    const [curValue, setCurValue] = useState('');

    useEffect(() => {
      // make the items list from the groups and contacts
      // each item has as key the id
      // and as value the name
      let items = [];
      for (let [key, value] of Object.entries(idToGroup)) {
        // only add non empty names
        if (value.name !== "")
          items.push({key: key, value: value.name});
      }
      for (let [key, value] of Object.entries(idToContact)) {
        if (value.name !== "")
          items.push({key: key, value: value.name});
      }
      setItems(items);
    }, [idToGroup, idToContact]);

    function handleSearch() {
      let search = ref.current.value;
      // Should the search be empty, unset the selected
      if (search === "") {
        setSelected(null);
        return;
      }

      // Find the item that matches the search
      let item = items.find((item) => item.value === search);
      // if the item is undefined, make the search red for a moment
      // which then fades back to white
      if (item === undefined) {
        ref.current.style.backgroundColor = "red";
        // TODO fade back to white
        setTimeout(() => {
          ref.current.value = "";
          setCurValue(ref.current.value);
          setSelected(null);
          ref.current.style.backgroundColor = "white";
        }, 1000);
      } else {
        setSelected(item.key);
      }
    }

    useEffect(() => {
      // set the value of the search field to the name of the selected item
      if (ref.current !== undefined) {
        if (selected !== null) {
          let item = items.find((item) => item.key === selected);
          if (item !== undefined) {
            ref.current.value = item.value;
          } else {
            console.log("Following item id not found");
            console.log(selected);
          }
        } else {
          ref.current.value = "";
        }
        setCurValue(ref.current.value);
      }
    }, [selected]);
  
    useEffect(() => {
      if (document.hasFocus() && ref.current.contains(document.activeElement)) {
        setFocus(true);
      }
    }, []);


    useEffect(() => {
      ref.current.addEventListener('focus', () => setFocus(true));
      ref.current.addEventListener('blur', () => setFocus(false));
      return () => {
        ref.current.removeEventListener('focus', () => setFocus(true));
        ref.current.removeEventListener('blur', () => setFocus(false));
      };
    }, []);

    function changeHandler() {
      // when the search field changes, set the curValue
      if (ref.current !== undefined)
        setCurValue(ref.current.value);
    }

    // When losing focus close the suggestions
    /*useEffect(() => {
      if (!hasFocus) {
        console.log("Search lost focus");
      }
    }, [hasFocus]);*/
  
    return (
      <>
        <InputGroup className="mb-3">
          <Form.Control
            ref={ref}
            placeholder="Currently no chat selected."
            aria-label="Currently no chat selected."
            aria-describedby="basic-addon2"
            onChange={changeHandler}
          />
          {ref.current !== undefined
            ? <Suggestions show={hasFocus} curValue={curValue} startFiltered={true} selected={selected} setSelected={setSelected} items={items} />
            : null}
          <Button variant="outline-secondary" id="button-addon2" onClick={() => handleSearch()}>
            <FaSearch />
          </Button>
        </InputGroup>
      </>
    );
}

/*

*/